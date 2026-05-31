#!/usr/bin/env bash
set -euo pipefail

# Deploy the client SPA to S3 and optionally invalidate CloudFront.
# Usage:
#   ./scripts/deploy-frontend.sh <s3-bucket-name> [<cloudfront-distribution-id>]
# Example:
#   ./scripts/deploy-frontend.sh rowdy-cloud-fe-bucket E123ABC45D6

BUCKET=${1:-}
DIST_ID=${2:-}

if [[ -z "$BUCKET" ]]; then
  echo "Usage: $0 <s3-bucket-name> [<cloudfront-distribution-id>]"
  exit 2
fi

echo "Building client..."
cd "$(dirname "$0")/.."/client
npm ci
npm run build

echo "Syncing dist/ to s3://$BUCKET"
aws s3 sync dist/ "s3://$BUCKET" --delete

if [[ -n "$DIST_ID" ]]; then
  echo "Creating CloudFront invalidation for distribution $DIST_ID"
  aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"
fi

echo "Deploy finished. Your site should be available at the CloudFront distribution or configured S3 website endpoint."
