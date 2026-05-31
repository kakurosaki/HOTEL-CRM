#!/bin/bash
# EC2 user-data script for launching the HOTEL-CRM backend on Ubuntu
# Replace REPO_URL and optionally BRANCH before using, or pass them via cloud-init.

set -euo pipefail

# --- Config (replace these) ---
REPO_URL="REPLACE_WITH_GIT_REPO_URL"
BRANCH="master"
APP_DIR="/home/ubuntu/hotel-crm"
BACKEND_DIR="$APP_DIR/Backend"
# --- End config ---

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create ubuntu user workspace
mkdir -p /home/ubuntu
chown ubuntu:ubuntu /home/ubuntu

sudo -u ubuntu bash -c "
  set -e
  # Clone repo (if not present)
  if [ ! -d \"$APP_DIR\" ]; then
    git clone --depth 1 --branch \"$BRANCH\" \"$REPO_URL\" \"$APP_DIR\"
  else
    cd \"$APP_DIR\" && git fetch origin \"$BRANCH\" && git checkout -B \"$BRANCH\" \"origin/$BRANCH\" && git pull origin \"$BRANCH\"
  fi

  cd \"$BACKEND_DIR\"
  npm ci --production

  # Create `.env` from template if it does not exist
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      echo "# TODO: edit .env with your DATABASE_URL and ALLOWED_ORIGINS" >> .env
    else
      echo "PORT=5000" > .env
      echo "# Set DATABASE_URL, ALLOWED_ORIGINS, AWS_REGION, AUDIT_DYNAMODB_TABLE" >> .env
    fi
  fi

  # Install pm2 and start the app
  sudo npm install -g pm2
  pm2 start src/index.js --name rowdy-cloud-api
  pm2 save
  pm2 startup systemd -u ubuntu --hp /home/ubuntu
"

echo "User-data script finished"
