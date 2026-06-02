#!/bin/bash
set -euo pipefail
# ============================================================
# UniFlow EC2 Deploy Script
# Builds image, pushes to ECR, deploys on EC2
# Handles disk space issues and verifies every step
# ============================================================

# Load local .env file if it exists to override defaults and load secrets
if [ -f .env ]; then
  # Clean up carriage returns, empty lines, and comments before exporting
  export $(grep -v '^#' .env | tr -d '\r' | xargs)
fi

EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
ECR_REGISTRY="${ECR_REGISTRY:-}"
ECR_REPO="${ECR_REPO:-uni360}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SSH_KEY="${SSH_KEY:-}"
MIN_DISK_MB=800
HEALTH_WAIT=25
HEALTH_RETRIES=3

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_ok()    { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_err()   { echo -e "${RED}❌ $1${NC}"; }

fail() { log_err "$1"; exit 1; }

# Detect AWS CLI — cmd.exe fallback for Git Bash on Windows
if command -v aws &>/dev/null; then
  run_aws() { aws "$@"; }
elif cmd.exe /C "aws --version" &>/dev/null 2>&1; then
  run_aws() { cmd.exe /C "aws $*"; }
else
  fail "AWS CLI not found. Install from https://aws.amazon.com/cli/"
fi

# =====================================================
# 1. PRE-FLIGHT CHECKS
# =====================================================

echo ""
echo "=========================================="
echo "  🚀 UniFlow Deploy Pipeline"
echo "=========================================="
echo ""

# Check SSH key exists
[ -f "$SSH_KEY" ] || fail "SSH key not found: $SSH_KEY"

# Check push-ecr script exists
[ -f "scripts/ec2/utils/push-ecr.sh" ] || fail "Push script not found: scripts/ec2/utils/push-ecr.sh"

# ========================================================
# 2. BUILD & PUSH TO ECR
# ========================================================
log_info "STEP 1/6 — Building image and pushing to ECR..."
echo ""

cd scripts/ec2
bash utils/push-ecr.sh ec2 --auto-cleanup
cd ../..

log_ok "Image pushed to ECR"
echo ""

# =======================================================
# 3. GET EC2 IP
# =======================================================

log_info "STEP 2/6 — Getting EC2 public IP..."

PUBLIC_IP=$(run_aws ec2 describe-instances \
  --instance-ids "$EC2_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  fail "Cannot get EC2 IP. Is instance running? (ID: $EC2_INSTANCE_ID)"
fi

log_ok "EC2 IP: $PUBLIC_IP"
echo ""

# Copy SSH key to /tmp so chmod works (WSL can't chmod files on Windows NTFS drives)
SSH_KEY_SRC="$(pwd)/scripts/ec2/uni360-ec2-key.pem"
SSH_KEY_TMP="/tmp/uniflow-ec2-key.pem"
[ -f "$SSH_KEY_SRC" ] || fail "SSH key not found at: $SSH_KEY_SRC"
cp "$SSH_KEY_SRC" "$SSH_KEY_TMP"
chmod 400 "$SSH_KEY_TMP"

SSH_CMD="ssh -i $SSH_KEY_TMP -o StrictHostKeyChecking=no -o ConnectTimeout=15 ubuntu@$PUBLIC_IP"

# ====================================================
# 4. CHECK DISK SPACE & AUTO-CLEANUP ON EC2
# ====================================================

log_info "STEP 3/6 — Checking EC2 disk space..."

AVAIL_MB=$($SSH_CMD "df --output=avail -BM / | tail -1 | tr -d ' M'" 2>/dev/null) || fail "Cannot SSH into EC2"

echo "  Disk available: ${AVAIL_MB}MB (minimum needed: ${MIN_DISK_MB}MB)"

if [ "$AVAIL_MB" -lt "$MIN_DISK_MB" ]; then
  log_warn "Low disk space (${AVAIL_MB}MB). Running auto-cleanup on EC2..."

  CLEANUP_OUTPUT=$($SSH_CMD bash -s <<'CLEANUP_EOF'
    set -e
    echo "  Pruning dangling Docker images..."
    docker image prune -f 2>&1 | tail -1

    echo "  Cleaning yum cache..."
    sudo yum clean all > /dev/null 2>&1 || true
    sudo rm -rf /var/cache/yum 2>/dev/null || true

    echo "  Trimming journal logs to 50M..."
    sudo journalctl --vacuum-size=50M > /dev/null 2>&1 || true

    echo "  Truncating Docker container logs..."
    sudo sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log' 2>/dev/null || true

    echo "  Cleaning old system logs..."
    sudo rm -rf /var/log/sa/* 2>/dev/null || true
    sudo sh -c 'cat /dev/null > /var/log/audit/audit.log' 2>/dev/null || true

    echo "  Removing leftover files..."
    rm -f ~/awscliv2.zip 2>/dev/null || true
    
    df --output=avail -BM / | tail -1 | tr -d ' M'
CLEANUP_EOF
  )

  # Last line of output is the new available space
  NEW_AVAIL_MB=$(echo "$CLEANUP_OUTPUT" | tail -1)
  echo "$CLEANUP_OUTPUT" | head -n -1

  echo "  Disk after cleanup: ${NEW_AVAIL_MB}MB"

  if [ "$NEW_AVAIL_MB" -lt "$MIN_DISK_MB" ]; then
    log_err "DEPLOY ABORTED — Not enough disk space after cleanup"
    echo ""
    echo "  Available: ${NEW_AVAIL_MB}MB"
    echo "  Required:  ${MIN_DISK_MB}MB"
    echo ""
    echo "  Fix options:"
    echo "    1. Expand EBS volume (currently 8GB):"
    echo "       aws ec2 modify-volume --volume-id vol-06bfe1c35e2d559e1 --size 20 --region us-east-1"
    echo "       Then SSH in and run: sudo growpart /dev/nvme0n1 1 && sudo xfs_growfs /"
    echo ""
    echo "    2. Manually free space on EC2:"
    echo "       ssh -i $SSH_KEY ec2-user@$PUBLIC_IP"
    echo "       docker system prune -af   # WARNING: removes ALL unused images"
    echo ""
    exit 1
  fi

  log_ok "Disk cleanup freed space: ${NEW_AVAIL_MB}MB available"
else
  log_ok "Disk space OK: ${AVAIL_MB}MB available"
fi
echo ""

# ========================================================
# 5. PULL NEW IMAGE (with verification)
# ========================================================

log_info "STEP 4/6 — Pulling new image on EC2..."

# Get current image digest before pull (if any)
OLD_DIGEST=$($SSH_CMD "docker inspect --format='{{.Image}}' uniflow-app 2>/dev/null || echo 'none'" 2>/dev/null)

PULL_OUTPUT=$($SSH_CMD bash -s <<PULL_EOF
  set -euo pipefail

  # ECR login
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY 2>&1

  # Pull new image — capture output and exit code
  echo "--- PULL START ---"
  if docker pull $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG 2>&1; then
    echo "--- PULL OK ---"
  else
    echo "--- PULL FAILED ---"
    echo ""
    echo "DISK STATUS:"
    df -h /
    exit 1
  fi

  # Verify the image exists locally with the right tag
  NEW_ID=\$(docker images --format '{{.ID}}' $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG 2>/dev/null)
  if [ -z "\$NEW_ID" ]; then
    echo "--- PULL VERIFY FAILED ---"
    exit 1
  fi

  echo "IMAGE_ID=\$NEW_ID"
PULL_EOF
) || {
  log_err "DEPLOY ABORTED — Image pull failed on EC2"
  echo ""
  echo "$PULL_OUTPUT" | grep -v "Login Succeeded" | grep -v "WARNING"
  echo ""
  echo "  This usually means the EC2 disk is full."
  echo "  Current disk:"
  $SSH_CMD "df -h /" 2>/dev/null || true
  echo ""
  echo "  Fix: Expand EBS volume to 20GB:"
  echo "    aws ec2 modify-volume --volume-id vol-06bfe1c35e2d559e1 --size 20 --region us-east-1"
  echo "    ssh -i $SSH_KEY ec2-user@$PUBLIC_IP 'sudo growpart /dev/nvme0n1 1 && sudo xfs_growfs /'"
  exit 1
}

# Verify pull actually succeeded by checking output
if echo "$PULL_OUTPUT" | grep -q "PULL FAILED"; then
  log_err "DEPLOY ABORTED — Image pull failed (disk full or network error)"
  echo ""
  echo "$PULL_OUTPUT" | tail -10
  exit 1
fi

if echo "$PULL_OUTPUT" | grep -q "PULL VERIFY FAILED"; then
  log_err "DEPLOY ABORTED — Pulled image not found locally"
  exit 1
fi

NEW_IMAGE_ID=$(echo "$PULL_OUTPUT" | grep "IMAGE_ID=" | cut -d= -f2)
log_ok "Image pulled successfully (ID: ${NEW_IMAGE_ID:-unknown})"
echo ""

# ========================================================
# 6. STOP OLD CONTAINER & START NEW ONE
# ========================================================

log_info "STEP 5/6 — Replacing container..."

DEPLOY_OUTPUT=$($SSH_CMD bash -s <<DEPLOY_EOF
  set -euo pipefail

  # Stop and remove old container
  echo "Stopping old container..."
  docker stop uniflow-app 2>/dev/null || true
  docker rm uniflow-app 2>/dev/null || true

  # Start new container
  echo "Starting new container..."
  docker run -d --name uniflow-app \
    --network host \
    --restart unless-stopped \
    --log-opt max-size=50m \
    --log-opt max-file=3 \
    --health-cmd "curl -f http://localhost:8080/api/v1/health || exit 1" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-start-period=60s \
    --health-retries=3 \
    -e SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}" \
    -e SPRING_R2DBC_URL="${SPRING_R2DBC_URL:-}" \
    -e SPRING_R2DBC_USERNAME="${SPRING_R2DBC_USERNAME:-}" \
    -e SPRING_R2DBC_PASSWORD="${SPRING_R2DBC_PASSWORD:-}" \
    -e SPRING_LIQUIBASE_URL="${SPRING_LIQUIBASE_URL:-}" \
    -e SPRING_LIQUIBASE_USER="${SPRING_LIQUIBASE_USER:-}" \
    -e SPRING_LIQUIBASE_PASSWORD="${SPRING_LIQUIBASE_PASSWORD:-}" \
    -e SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-}" \
    -e SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-}" \
    -e SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-}" \
    -e AWS_S3_BUCKET_NAME="${AWS_S3_BUCKET_NAME:-}" \
    -e AWS_S3_REGION="${AWS_S3_REGION:-}" \
    -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}" \
    -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}" \
    -e RAZORPAY_KEY_ID="${RAZORPAY_KEY_ID:-}" \
    -e RAZORPAY_KEY_SECRET="${RAZORPAY_KEY_SECRET:-}" \
    -e RAZORPAY_AMOUNT="${RAZORPAY_AMOUNT:-0}" \
    -e JWT_SECRET="${JWT_SECRET:-}" \
    -e GOOGLE_OAUTH_CLIENT_ID="${GOOGLE_OAUTH_CLIENT_ID:-}" \
    -e GOOGLE_OAUTH_CLIENT_SECRET="${GOOGLE_OAUTH_CLIENT_SECRET:-}" \
    -e UNIFLOW_MASTER_VERIFY_TOKEN="${UNIFLOW_MASTER_VERIFY_TOKEN:-}" \
    -e UNIFLOW_AI_N8N_BASE_URL="${UNIFLOW_AI_N8N_BASE_URL:-}" \
    -e UNIFLOW_AI_N8N_WEBHOOK_SECRET="${UNIFLOW_AI_N8N_WEBHOOK_SECRET:-}" \
    $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG

  # Prune old images to free space
  echo "Pruning old images..."
  docker image prune -f 2>&1 | tail -1

  echo "--- DEPLOY OK ---"
DEPLOY_EOF
) || fail "Failed to start new container on EC2"

if ! echo "$DEPLOY_OUTPUT" | grep -q "DEPLOY OK"; then
  fail "Container deployment did not complete successfully"
fi

log_ok "New container started"
echo ""


# ========================================================
# 7. HEALTH CHECK
# ========================================================
log_info "STEP 6/6 — Waiting ${HEALTH_WAIT}s for Spring Boot startup..."
sleep "$HEALTH_WAIT"

HEALTHY=false
for i in $(seq 1 $HEALTH_RETRIES); do
  echo "  Health check attempt $i/$HEALTH_RETRIES..."

  HEALTH=$(curl -sf "http://$PUBLIC_IP:8080/actuator/health" 2>/dev/null || echo "")

  if [ -n "$HEALTH" ] && echo "$HEALTH" | grep -q '"status":"UP"'; then
    HEALTHY=true
    break
  fi

  if [ "$i" -lt "$HEALTH_RETRIES" ]; then
    echo "  Not ready yet, waiting 10s..."
    sleep 10
  fi
done

echo ""
if [ "$HEALTHY" = true ]; then
  echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
  echo ""
  log_ok "DEPLOY SUCCESSFUL"
else
  log_warn "Health check did not return UP after $HEALTH_RETRIES attempts"
  echo "  App may still be starting. Check logs:"
  echo "    ssh -i $SSH_KEY ec2-user@$PUBLIC_IP 'docker logs --tail 50 uniflow-app'"
  echo ""
  log_warn "DEPLOY COMPLETED (health unconfirmed)"
fi

# ========================================================
# SUMMARY
# ========================================================
echo ""
echo "=========================================="
echo "  Deploy Summary"
echo "=========================================="
echo "  Image:    $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
echo "  EC2:      $PUBLIC_IP"
echo "  API:      https://api.uniflow.kartonmeister.com"
echo "  Profile:  dev-aws"
echo ""
echo "  Useful commands:"
echo "    Logs:     ssh -i $SSH_KEY ec2-user@$PUBLIC_IP 'docker logs -f --tail 100 uniflow-app'"
echo "    Status:   ssh -i $SSH_KEY ec2-user@$PUBLIC_IP 'docker ps'"
echo "    Health:   curl -s https://api.uniflow.kartonmeister.com/actuator/health | python3 -m json.tool"
echo "    Rollback: ssh -i $SSH_KEY ec2-user@$PUBLIC_IP 'docker stop uniflow-app && docker rm uniflow-app && docker run -d --name uniflow-app -p 8080:8080 --restart unless-stopped -e SPRING_PROFILES_ACTIVE=dev-aws $ECR_REGISTRY/$ECR_REPO:backup'"
echo "=========================================="
echo ""

# Final disk report
FINAL_DISK=$($SSH_CMD "df -h / --output=pcent,avail | tail -1" 2>/dev/null || echo "unknown")
echo "  EC2 disk: $FINAL_DISK"
echo ""