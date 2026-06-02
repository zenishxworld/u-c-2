#!/bin/bash
set -euo pipefail
# ============================================================
# push-ecr.sh — Build Docker image and push to ECR
# Usage: bash push-ecr.sh <image-tag> [--auto-cleanup]
# ============================================================

IMAGE_TAG="${1:-ec2}"
AUTO_CLEANUP="${2:-}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
ECR_REGISTRY="${ECR_REGISTRY:-817100478450.dkr.ecr.ap-southeast-2.amazonaws.com}"
ECR_REPO="${ECR_REPO:-uni360}"

# Detect AWS CLI — cmd.exe is always available in Git Bash on Windows
if command -v aws &>/dev/null; then
  run_aws() { aws "$@"; }
elif cmd.exe /C "aws --version" &>/dev/null 2>&1; then
  run_aws() { cmd.exe /C "aws $*"; }
else
  echo "❌ AWS CLI not found. Install from https://aws.amazon.com/cli/ and restart terminal."
  exit 1
fi

FULL_IMAGE="$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_err()  { echo -e "${RED}❌ $1${NC}"; }

# Navigate to project root (two levels up from scripts/ec2/utils)
cd "$(dirname "$0")/../../.."

log_info "Building Docker image: $FULL_IMAGE"
echo "  Context: $(pwd)"
echo ""

# ---- Optional: free up space before build ----
if [ "$AUTO_CLEANUP" = "--auto-cleanup" ]; then
  log_info "Auto-cleanup: removing dangling images..."
  docker image prune -f > /dev/null 2>&1 || true
fi

# ---- Build ----
docker build \
  --no-cache \
  --platform linux/amd64 \
  --tag "$FULL_IMAGE" \
  --tag "$ECR_REGISTRY/$ECR_REPO:latest" \
  . || {
    log_err "Docker build failed"
    exit 1
  }

log_ok "Image built: $FULL_IMAGE"
echo ""

# ---- ECR Login ----
log_info "Logging in to ECR ($AWS_REGION)..."
LOGIN_PASSWORD=$(run_aws ecr get-login-password --region "$AWS_REGION" 2>&1) || {
  log_err "Failed to get ECR login password: $LOGIN_PASSWORD"
  exit 1
}
echo "$LOGIN_PASSWORD" | docker login --username AWS --password-stdin "$ECR_REGISTRY" || {
  log_err "ECR login failed. Check AWS credentials and that the ECR repo exists."
  echo ""
  echo "  Create ECR repo if missing:"
  echo "    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION"
  exit 1
}

log_ok "ECR login successful"
echo ""

# ---- Push ----
log_info "Pushing image to ECR..."
docker push "$FULL_IMAGE" || {
  log_err "Image push failed"
  exit 1
}

log_ok "Image pushed: $FULL_IMAGE"
echo ""
