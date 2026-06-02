#!/bin/bash
set -euo pipefail

# Load local .env file if it exists to override defaults and load secrets
if [ -f .env ]; then
  export $(grep -v '^#' .env | tr -d '\r' | xargs)
fi

EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-}"
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Starting EC2 and RDS..."

# Check and start RDS
RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier $RDS_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text)

if [ "$RDS_STATUS" = "stopped" ]; then
  echo "Starting RDS instance..."
  aws rds start-db-instance \
    --db-instance-identifier $RDS_INSTANCE_ID \
    --region $AWS_REGION \
    --output json > /dev/null
  echo "⏳ Waiting for RDS to be available..."
  aws rds wait db-instance-available \
    --db-instance-identifier $RDS_INSTANCE_ID \
    --region $AWS_REGION
  echo "✅ RDS started"
elif [ "$RDS_STATUS" = "available" ]; then
  echo "✅ RDS already running"
else
  echo "⏳ RDS is $RDS_STATUS, waiting for available..."
  aws rds wait db-instance-available \
    --db-instance-identifier $RDS_INSTANCE_ID \
    --region $AWS_REGION
  echo "✅ RDS ready"
fi

# Check and start EC2
EC2_STATE=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text)

if [ "$EC2_STATE" = "stopped" ]; then
  echo "Starting EC2 instance..."
  aws ec2 start-instances \
    --instance-ids $EC2_INSTANCE_ID \
    --region $AWS_REGION \
    --output text > /dev/null
  echo "⏳ Waiting for EC2 to be ready..."
  aws ec2 wait instance-running \
    --instance-ids $EC2_INSTANCE_ID \
    --region $AWS_REGION
  echo "✅ EC2 started"
elif [ "$EC2_STATE" = "running" ]; then
  echo "✅ EC2 already running"
else
  echo "⏳ EC2 is $EC2_STATE, waiting for running..."
  aws ec2 wait instance-running \
    --instance-ids $EC2_INSTANCE_ID \
    --region $AWS_REGION
  echo "✅ EC2 ready"
fi

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo ""
echo "⏳ Waiting for application..."
sleep 30

curl -sf http://$PUBLIC_IP:8080/actuator/health | jq . || echo "⚠️  Health check failed (may need more time)"
echo "✅ Started at http://$PUBLIC_IP:8080"

# Start monitoring stack (Prometheus + Grafana + Loki)
echo ""
echo "📊 Starting monitoring stack..."
ssh -i scripts/ec2/uniflow-ec2-key.pem -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP << 'MONITORING_EOF'
if [ -d ~/monitoring ]; then
  cd ~/monitoring
  if [ -f manage.sh ]; then
    ./manage.sh start > /dev/null 2>&1 || echo "⚠️  Monitoring start failed (non-critical)"
    echo "✅ Monitoring stack started (Prometheus, Grafana, Loki)"
    echo "   📊 Prometheus: http://localhost:9090"
    echo "   📈 Grafana: https://grafana.uniflow.kartonmeister.com"
  else
    echo "⚠️  Monitoring scripts not found (skipping)"
  fi
else
  echo "⚠️  Monitoring directory not found (skipping)"
fi
MONITORING_EOF
