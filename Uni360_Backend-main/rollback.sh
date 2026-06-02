#!/bin/bash
set -euo pipefail

# Load local .env file if it exists to override defaults and load secrets
if [ -f .env ]; then
  export $(grep -v '^#' .env | tr -d '\r' | xargs)
fi

EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REGISTRY="${ECR_REGISTRY:-}"
ECR_REPO="${ECR_REPO:-uniflow-app}"
IMAGE_TAG="${IMAGE_TAG:-backup}"

echo "⏪ Rolling back to backup image..."

echo "📡 Getting EC2 public IP..."
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  echo "❌ Cannot get EC2 IP. Is instance running?"
  exit 1
fi

echo "🔗 Rolling back on $PUBLIC_IP..."

ssh -i scripts/ec2/uniflow-ec2-key.pem -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP << EOF
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
docker pull $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
docker stop uniflow-app 2>/dev/null || true
docker rm uniflow-app 2>/dev/null || true
docker run -d --name uniflow-app -p 8080:8080 --restart unless-stopped \
  --health-cmd "curl -f http://localhost:8080/actuator/health || exit 1" \
  --health-interval=30s --health-timeout=10s --health-start-period=60s --health-retries=3 \
  -e SPRING_PROFILES_ACTIVE=dev-aws \
  $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
EOF

echo "⏳ Waiting for application..."
sleep 20

curl -sf http://$PUBLIC_IP:8080/actuator/health | jq . || echo "⚠️  Health check failed"
echo "✅ Rolled back to backup image!"
