#!/usr/bin/env bash
# Simple helper to upload `client/dist` to an S3 bucket
# Usage: ./upload_dist_to_s3.sh your-bucket-name us-east-1

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <s3-bucket> [region]"
  exit 2
fi

BUCKET=$1
REGION=${2:-us-east-1}
DIST_DIR="client/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: $DIST_DIR not found. Run 'npm run build' in client first." >&2
  exit 1
fi

echo "Syncing $DIST_DIR -> s3://$BUCKET ..."
aws s3 sync "$DIST_DIR" "s3://$BUCKET/" --region "$REGION" --delete --acl public-read

echo "Uploading runtime env.js (no-cache) ..."
if [ -f "$DIST_DIR/env.js" ]; then
  aws s3 cp "$DIST_DIR/env.js" "s3://$BUCKET/env.js" --region "$REGION" --cache-control no-cache --acl public-read
else
  echo "Warning: $DIST_DIR/env.js not found. Create one and re-run if you need runtime overrides." >&2
fi

echo "Upload complete. If using CloudFront, consider invalidating cache." 
