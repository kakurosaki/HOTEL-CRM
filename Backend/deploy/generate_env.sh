#!/usr/bin/env bash
# Generate a `.env` file from `.env.prod.example` using environment variables.
set -euo pipefail

TEMPLATE_FILE=".env.prod.example"
TARGET_FILE=".env"

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Template $TEMPLATE_FILE not found." >&2
  exit 1
fi

cp "$TEMPLATE_FILE" "$TARGET_FILE"

# Replace placeholders if env vars provided
if [ -n "${DATABASE_URL-}" ]; then
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|g" "$TARGET_FILE"
fi
if [ -n "${ALLOWED_ORIGINS-}" ]; then
  sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${ALLOWED_ORIGINS}|g" "$TARGET_FILE"
fi
if [ -n "${AWS_REGION-}" ]; then
  sed -i "s|AWS_REGION=.*|AWS_REGION=${AWS_REGION}|g" "$TARGET_FILE"
fi

echo "Generated $TARGET_FILE from $TEMPLATE_FILE"
