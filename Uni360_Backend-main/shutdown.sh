#!/bin/bash
set -euo pipefail

# Load local .env file if it exists to override defaults and load secrets
if [ -f .env ]; then
  export $(grep -v '^#' .env | tr -d '\r' | xargs)
fi

EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-}"
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🛑 Shutting down EC2 and RDS..."

# Stop monitoring stack first (while EC2 still running)
echo ""
echo "📊 Stopping monitoring stack..."
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

if [ ! -z "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
  ssh -i scripts/ec2/uniflow-ec2-key.pem -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP << 'MONITORING_EOF'
if [ -d ~/monitoring ]; then
  cd ~/monitoring
  if [ -f manage.sh ]; then
    ./manage.sh stop > /dev/null 2>&1 || echo "⚠️  Monitoring stop failed (non-critical)"
    echo "✅ Monitoring stack stopped"
  fi
fi
MONITORING_EOF
else
  echo "⚠️  Cannot get EC2 IP, skipping monitoring shutdown"
fi

echo ""
echo "🛑 Stopping infrastructure..."

# Check and stop EC2
EC2_STATE=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text)

if [ "$EC2_STATE" = "running" ]; then
  echo "Stopping EC2 instance..."
  aws ec2 stop-instances \
    --instance-ids $EC2_INSTANCE_ID \
    --region $AWS_REGION \
    --output text > /dev/null
  echo "✅ EC2 shutdown initiated"
elif [ "$EC2_STATE" = "stopped" ]; then
  echo "✅ EC2 already stopped"
else
  echo "⏳ EC2 is $EC2_STATE (skipping)"
fi

# Check and stop RDS
RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier $RDS_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text)

if [ "$RDS_STATUS" = "available" ]; then
  echo "Stopping RDS instance..."
  aws rds stop-db-instance \
    --db-instance-identifier $RDS_INSTANCE_ID \
    --region $AWS_REGION \
    --output json > /dev/null
  echo "✅ RDS shutdown initiated"
elif [ "$RDS_STATUS" = "stopped" ]; then
  echo "✅ RDS already stopped"
else
  echo "⏳ RDS is $RDS_STATUS (skipping)"
fi

echo ""
echo "💡 RDS auto-restarts after 7 days (AWS limitation)"
echo "🚀 Use ./startup.sh to restart"
