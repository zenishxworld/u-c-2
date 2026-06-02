#!/bin/bash
set -euo pipefail

# Load local .env file if it exists to override defaults and load secrets
if [ -f .env ]; then
  export $(grep -v '^#' .env | tr -d '\r' | xargs)
fi

EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-}"
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "📊 Checking AWS status..."

EC2_STATE=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text)

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier $RDS_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text)

echo "EC2: $EC2_STATE ($PUBLIC_IP)"
echo "RDS: $RDS_STATUS"

if [ "$EC2_STATE" = "running" ]; then
  echo ""
  echo "⏳ Checking application health..."
  HEALTH=$(curl -sf http://$PUBLIC_IP:8080/actuator/health 2>/dev/null || echo "")

  if [ -n "$HEALTH" ]; then
    echo "$HEALTH" | jq .
    echo "✅ App running at http://$PUBLIC_IP:8080"
  else
    echo "❌ App not responding"
  fi

  echo ""
  echo "⏳ Checking n8n health..."
  N8N_HEALTH=$(curl -sf https://n8n.uniflow.kartonmeister.com/healthz 2>/dev/null || echo "")

  if [ -n "$N8N_HEALTH" ] && echo "$N8N_HEALTH" | grep -q "ok"; then
    echo "✅ n8n healthy at https://n8n.uniflow.kartonmeister.com"
  else
    echo "❌ n8n not responding"
  fi

  echo ""
  echo "⏳ Checking AI → n8n connectivity..."
  AI_HEALTH=$(curl -sf https://api.uniflow.kartonmeister.com/api/v1/ai/health -H 'X-Client-ID: uni360' 2>/dev/null || echo "")

  if [ -n "$AI_HEALTH" ]; then
    N8N_STATUS=$(echo "$AI_HEALTH" | jq -r '.data.n8n.status // .data.status // "UNKNOWN"' 2>/dev/null)
    if [ "$N8N_STATUS" = "UP" ]; then
      RESPONSE_MS=$(echo "$AI_HEALTH" | jq -r '.data.n8n.responseTimeMs // "?"' 2>/dev/null)
      echo "✅ AI → n8n connected (${RESPONSE_MS}ms)"
    else
      echo "❌ AI → n8n disconnected"
      echo "$AI_HEALTH" | jq . 2>/dev/null || echo "$AI_HEALTH"
    fi
  else
    echo "❌ AI health endpoint not responding"
  fi
else
  echo ""
  echo "💤 Use ./startup.sh to start"
fi
