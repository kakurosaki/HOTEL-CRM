#!/usr/bin/env bash
set -euo pipefail

REGION="eu-central-1"
SRC_DB="aws"
SNAP_ID="rowdy-snapshot-$(date +%Y%m%d%H%M%S)"
RESTORE_DB="rowdy-db-restored"
DB_SUBNET_GROUP="rowdy-db-subnet-group"
# Subnets you provided:
SUBNET_IDS=(subnet-0a49772b72649f45b subnet-0c5dba6d21245b53c)
RDS_SG="sg-01727cc7d772f18a6"
EC2_SG="sg-0b547744babcd9ecb"
DB_CLASS="db.t3.medium"

echo "Region: ${REGION}"
echo "DB subnet group: ${DB_SUBNET_GROUP}"
echo "Subnets: ${SUBNET_IDS[*]}"

# Create DB subnet group if it doesn't exist
if aws rds describe-db-subnet-groups --db-subnet-group-name "${DB_SUBNET_GROUP}" --region "${REGION}" >/dev/null 2>&1; then
  echo "DB subnet group ${DB_SUBNET_GROUP} already exists. Skipping creation."
else
  echo "Creating DB subnet group ${DB_SUBNET_GROUP}..."
  aws rds create-db-subnet-group \
    --db-subnet-group-name "${DB_SUBNET_GROUP}" \
    --db-subnet-group-description "Rowdy DB subnet group" \
    --subnet-ids "${SUBNET_IDS[@]}" \
    --region "${REGION}"
  echo "Created DB subnet group."
fi

echo "1) Creating snapshot ${SNAP_ID} from DB instance ${SRC_DB}..."
aws rds create-db-snapshot \
  --db-snapshot-identifier "${SNAP_ID}" \
  --db-instance-identifier "${SRC_DB}" \
  --region "${REGION}"

echo "Waiting for snapshot to become available..."
aws rds wait db-snapshot-available \
  --db-snapshot-identifier "${SNAP_ID}" \
  --region "${REGION}"
echo "Snapshot available: ${SNAP_ID}"

echo "2) Restoring snapshot into DB instance ${RESTORE_DB}..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "${RESTORE_DB}" \
  --db-snapshot-identifier "${SNAP_ID}" \
  --db-subnet-group-name "${DB_SUBNET_GROUP}" \
  --vpc-security-group-ids "${RDS_SG}" \
  --db-instance-class "${DB_CLASS}" \
  --no-publicly-accessible \
  --region "${REGION}"

echo "Waiting for restored DB instance to become available (may take several minutes)..."
aws rds wait db-instance-available \
  --db-instance-identifier "${RESTORE_DB}" \
  --region "${REGION}"

ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "${RESTORE_DB}" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region "${REGION}")

echo "Restored DB endpoint: ${ENDPOINT}"

echo "3) Adding ingress rule in RDS SG ${RDS_SG} to allow EC2 SG ${EC2_SG} on port 5432..."
aws ec2 authorize-security-group-ingress \
  --group-id "${RDS_SG}" \
  --protocol tcp --port 5432 \
  --source-group "${EC2_SG}" \
  --region "${REGION}" || true

echo ""
echo "Done. Next actions:"
echo "- SSH to your EC2 app host and update Backend/.env DATABASE_URL to:"
echo "  postgres://<user>:<pass>@${ENDPOINT}:5432/<dbname>"
echo "- Restart the app:"
echo "  pm2 restart rowdy-cloud-api"
echo ""
echo "Verify from EC2:"
echo "  dig +short ${ENDPOINT}"
echo "  nc -vz -w 5 ${ENDPOINT} 5432"
echo "  PGPASSWORD='<password>' psql -h ${ENDPOINT} -U <user> -d <dbname> -c '\\l'  # if psql available"
echo "  curl -v http://127.0.0.1:5000/api/health"