#!/bin/bash
# =============================================================================
#  UniFlow Platform — Redeploy via Git Script (Bare-Metal JVM Deployment)
# =============================================================================
#
#  PREREQUISITES on the server:
#    - Git             (https://git-scm.com/)
#    - Java JDK 17     (https://openjdk.org/)
#    - Maven 3.x       (https://maven.apache.org/)
#    - PostgreSQL, Redis, Kafka, and n8n running or accessible.
#
#  CONFIGURATION:
#    Configure variables in a local '.env' file in this directory.
#    All parameters will load automatically at runtime.
#
#  REQUIRED ENVIRONMENT VARIABLES (.env):
#    SPRING_PROFILES_ACTIVE=dev
#    SPRING_R2DBC_URL=r2dbc:postgresql://<host>:5432/<db>
#    SPRING_R2DBC_USERNAME=<username>
#    SPRING_R2DBC_PASSWORD=<password>
#    SPRING_LIQUIBASE_URL=jdbc:postgresql://<host>:5432/<db>
#    SPRING_LIQUIBASE_USER=<username>
#    SPRING_LIQUIBASE_PASSWORD=<password>
#    JWT_SECRET=<secure_random_string_32_characters>
#    RAZORPAY_KEY_ID=<your_razorpay_key_id>
#    RAZORPAY_KEY_SECRET=<your_razorpay_key_secret>
#    GOOGLE_OAUTH_CLIENT_ID=<google_client_id>
#    GOOGLE_OAUTH_CLIENT_SECRET=<google_client_secret>
#    AWS_ACCESS_KEY_ID=<aws_access_key>
#    AWS_SECRET_ACCESS_KEY=<aws_secret_key>
#    AWS_S3_BUCKET_NAME=<s3_bucket_name>
#    AWS_S3_REGION=<aws_region>
#    UNIFLOW_AI_N8N_BASE_URL=<n8n_url>
#    UNIFLOW_AI_N8N_WEBHOOK_SECRET=<webhook_secret>
#
#  USAGE:
#    chmod +x redeploy-via-git.sh
#    ./redeploy-via-git.sh
# =============================================================================

set -e

# ─── COLORS ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()     { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "============================================================"
echo "  UniFlow Platform — Bare-Metal Git Redeployment"
echo "============================================================"
echo ""

# ─── STEP 1: CHECK PREREQUISITES ──────────────────────────────────────────────
log "Checking prerequisites..."
command -v git >/dev/null 2>&1 || error "Git is not installed."
command -v java >/dev/null 2>&1 || error "Java JDK is not installed."
command -v mvn >/dev/null 2>&1 || error "Maven (mvn) is not installed."

# Check Java Version (must be 17+)
JAVA_VER=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}' | cut -d'.' -f1)
# Some JDKs return '17' directly, others return '1.8' (for Java 8)
if [ "$JAVA_VER" -lt 17 ] && [ "$JAVA_VER" != "17" ]; then
    warn "Java version is $JAVA_VER. JDK 17 is recommended."
fi
ok "Prerequisites checked."

# ─── STEP 2: LOAD ENV VARIABLES ───────────────────────────────────────────────
log "Loading configuration variables..."
if [ -f .env ]; then
    # Clean up carriage returns, empty lines, and comments before exporting
    export $(grep -v '^#' .env | tr -d '\r' | xargs)
    ok "Loaded configuration from .env"
else
    warn "No .env file found in this directory. Default environment parameters will be used."
fi

# ─── STEP 3: GIT PULL LATEST CHANGES ──────────────────────────────────────────
log "Pulling latest changes from Git..."
git pull || warn "Could not pull latest changes. Continuing with local workspace."
ok "Git workspace is updated."

# ─── STEP 4: BUILD JAR WITH MAVEN ─────────────────────────────────────────────
log "Building project package with Maven..."
mvn clean package -DskipTests || error "Maven compilation failed."
ok "Build completed. JAR artifact generated."

# ─── STEP 5: STOP CURRENT APPLICATION INSTANCE ────────────────────────────────
log "Stopping any running instance of UniFlow backend..."
PORT_PID=$(lsof -t -i:8080 2>/dev/null || true)
JAR_PID=$(pgrep -f "uniflow-consolidated" 2>/dev/null || true)

# Combine and unique PIDs
PIDS_TO_KILL=$(echo -e "${PORT_PID}\n${JAR_PID}" | grep -v "^$" | sort -u || true)

if [ -n "$PIDS_TO_KILL" ]; then
    log "Stopping running process(es): $PIDS_TO_KILL..."
    for pid in $PIDS_TO_KILL; do
        kill -15 "$pid" 2>/dev/null || true
    done
    sleep 3
    # Double check and force kill if still running
    for pid in $PIDS_TO_KILL; do
        if kill -0 "$pid" 2>/dev/null; then
            warn "Process $pid did not exit. Force killing..."
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    ok "Stopped previous running instance."
else
    log "No active UniFlow instance detected on port 8080."
fi

# ─── STEP 6: START NEW INSTANCE IN BACKGROUND ─────────────────────────────────
JAR_FILE=$(find target -name "uniflow-consolidated-*.jar" | head -n 1)
if [ -z "$JAR_FILE" ]; then
    error "Could not find compiled JAR file in target/ directory."
fi

log "Starting application in background using: $JAR_FILE"
nohup java -jar "$JAR_FILE" > backend.log 2>&1 &
NEW_PID=$!

ok "Application started in background (PID: $NEW_PID)."
log "Redirecting output logs to: backend.log"

# ─── STEP 7: MONITOR HEALTH CHECK ─────────────────────────────────────────────
log "Waiting for application to start up (up to 90 seconds)..."
HEALTH_URL="http://localhost:8080/actuator/health"
TIMEOUT=90
WAITED=0
IS_HEALTHY=false

until curl -sf "$HEALTH_URL" >/dev/null 2>&1; do
    if [ "$WAITED" -ge "$TIMEOUT" ]; then
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
    log "  Still waiting for start up... (${WAITED}s elapsed)"
done

if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    IS_HEALTHY=true
fi

# ─── STEP 8: SUMMARY ──────────────────────────────────────────────────────────
echo ""
echo "============================================================"
if [ "$IS_HEALTHY" = true ]; then
    ok "Deployment SUCCESSFUL!"
    echo ""
    echo "  App URL   : http://localhost:8080"
    echo "  Health    : $HEALTH_URL"
    echo "  Logs      : tail -f backend.log"
else
    warn "Deployment complete, but health check is not responding yet."
    echo "  Please check the log file for details:"
    echo "  Command   : tail -n 100 backend.log"
fi
echo "============================================================"
echo ""
