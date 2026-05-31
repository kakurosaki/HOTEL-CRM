# AWS Deployment Guide for Rowdy Cloud

This guide walks you through setting up the AWS services for this project from scratch.
It assumes you are new to AWS and want a practical path that matches the current codebase.

## Quick Beginner Path

If AWS is brand new to you, follow the services in this order:

1. Create your AWS account and set a budget alarm.
2. Create DynamoDB for audit logs.
3. Launch EC2 and run the backend.
4. Create S3 and upload the frontend build.
5. Add CloudFront in front of S3 if you want HTTPS.
6. Create Lambda and schedule it with EventBridge.
7. Turn on CloudTrail.

If you get lost, come back to this order. It matches the app setup best.

Important note:

- The app currently uses PostgreSQL for the main hotel data: guests, bookings, rooms, staff.
- If you want a true AWS migration, DynamoDB should replace PostgreSQL for the hotel data layer.
- That is a bigger change than the audit-log setup because the whole data model changes.

## What You Will Set Up

Core services:

- S3 for the React frontend
- EC2 for the Express backend
- DynamoDB for hotel data and audit logs

Optional but recommended:

- CloudFront for faster and more secure static hosting
- CloudTrail for AWS activity auditing
- Lambda + EventBridge for scheduled room-status sync

You can use these services as a clean demo architecture:

- S3 or CloudFront serves the client
- EC2 serves the API
- DynamoDB stores hotel records and audit activity
- Lambda runs the room automation on a schedule
- CloudTrail records AWS-side changes

## 1. Create Your AWS Account and Basic Safety Setup

If you do not already have an AWS account:

1. Go to the AWS website and sign up.
2. Add a payment method.
3. Choose a region and try to stay in one region for everything, such as `us-east-1`.
4. Set a budget alarm so you do not get surprised by charges.

After signing in:

1. Open the IAM service.
2. Create an admin user for yourself.
3. Do not use the root account for daily work.
4. Turn on multi-factor authentication if possible.

Suggested safety habits:

- Use IAM users or roles instead of root.
- Give yourself only the permissions you need.
- Check Billing regularly.

## 2. Create the S3 Bucket for the Frontend

This bucket will host the built React app.

### A. Create the bucket

1. Open the S3 service in AWS.
2. Click Create bucket.
3. Choose a globally unique bucket name, such as `rowdy-cloud-frontend-yourname`.
4. Pick the same region as the rest of your project.
5. Leave Block all public access on for now if you plan to use CloudFront.
6. If you want to use plain S3 static website hosting directly, you may need to allow public access, but CloudFront is the better option.

### B. Enable static website hosting

1. Open the bucket.
2. Go to Properties.
3. Find Static website hosting.
4. Enable it.
5. Set `index.html` as the index document.
6. Set `index.html` as the error document too, because this is a single-page app.

### C. Upload the frontend build

1. On your computer, go to the `client` folder.
2. Run `npm install` if needed.
3. Run `npm run build`.
4. Upload everything inside the generated `dist` folder to the S3 bucket.

This guide walks through a hands-off, repeatable deployment process for the HOTEL-CRM project and is intended to be handed to a teammate who will perform the deployment.

Overview

- Goal: deploy the React frontend to S3/CloudFront and the Express backend to EC2, keep PostgreSQL as the primary DB (RDS or self-hosted), optionally add DynamoDB for audit logs and Lambda for scheduled tasks.
- This document includes: exact commands, required environment variables, the repo changes made for deployment, helper scripts, verification steps, and rollback instructions.

Prerequisites for the person doing the deployment

- An AWS account with appropriate permissions to create S3, CloudFront, EC2, RDS (optional), DynamoDB (optional), Lambda, IAM, and CloudTrail.
- AWS CLI configured on their laptop (or use the console): `aws configure`.
- SSH keypair to access EC2 instances.
- The project repository URL and an account that can access it (public or with deploy key).

Files your teammate should know about (changes made for deployment)

- `client/public/env.js`: runtime override file that can be edited on S3 to set `VITE_API_BASE_URL` without rebuilding.
- `client/src/js/utils/api.js`: updated to prefer runtime `window.__ENV__` then fall back to build-time `import.meta.env`.
- `Backend/src/index.js`: now binds to `0.0.0.0` by default, masks DB URL in logs, and performs graceful shutdown (closes Postgres pool, stops interval).
- `Backend/src/utils/audit.js`: optional dual-write to DynamoDB if `AUDIT_DYNAMODB_TABLE` environment variable is set (old Postgres audit remains available).
- `Backend/aws/lambda/roomStatusSync.js`: Lambda handler for room-status sync (same logic as the Express process uses).
- `Backend/package.json`: added `start:prod` script.
- `Backend/.env.example` and `Backend/.env.prod.example`: templates for environment variables.
- `Backend/deploy/ec2-user-data.sh`: EC2 user-data script to automate setup (update `REPO_URL`).
- `deploy/upload_dist_to_s3.sh`: helper to sync `client/dist` to S3 and upload `env.js` with `Cache-Control: no-cache`.
- `Backend/deploy/generate_env.sh`: helper to generate `.env` from `.env.prod.example` on the EC2 server.
- `deploy/README.md`: short notes about the helper scripts.

High-level deployment steps (what the teammate will perform)

1.  Provision or prepare the PostgreSQL database (RDS recommended). Create user and database `aws` to match current local setup, or adjust `DATABASE_URL` accordingly.
2.  Build the frontend locally and upload the `dist` contents to S3 (or let CI do it). Add `env.js` at the bucket root to point the frontend to the backend API.
3.  Launch an EC2 instance, provide `Backend/deploy/ec2-user-data.sh` as user-data (after editing `REPO_URL`), then SSH and finalize `.env` and start the app with pm2.
4.  (Optional) Create DynamoDB table(s) for audit logs and attach IAM role to EC2 to allow `dynamodb:PutItem` and `dynamodb:Query` for the table.
5.  (Optional) Deploy Lambda `Backend/aws/lambda/roomStatusSync.js` and schedule with EventBridge if you prefer scheduled sync outside EC2.
6.  Verify front-end <-> back-end integration and run end-to-end tests.

Exact step-by-step runbook (copy-paste friendly)

Part A — Database (RDS) setup

- Create an RDS Postgres instance or ensure an existing Postgres is reachable from EC2.
- Create database `aws` and a user `postgres` (or another user) with a secure password.
- Note the connection string; example:
  `postgres://postgres:YourStrongPassword@your-rds-endpoint.region.rds.amazonaws.com:5432/aws`

Part B — Frontend: build and upload to S3 (on your laptop or CI)

1. On your laptop (or CI), run:

```bash
# from repo root
cd client
npm ci
npm run build
```

2. Upload the `dist` contents to S3. Using the included helper (requires AWS CLI configured):

```bash
./deploy/upload_dist_to_s3.sh your-bucket-name us-east-1
```

3. Ensure `index.html` is at the bucket root and `assets/` is present.

4. Configure runtime `env.js` at the bucket root to override the API URL (this file is included in the build as `dist/env.js` and editable after upload). Create or edit `env.js` with:

```html
<script>
  window.__ENV__ = {
    VITE_API_BASE_URL: "https://api.your-ec2-domain-or-loadbalancer",
  };
</script>
```

Notes:

- The `upload_dist_to_s3.sh` script uploads `env.js` with `Cache-Control: no-cache` so changes are effective immediately.
- If using CloudFront, invalidate the distribution or create invalidation for `/index.html` and `/env.js` after uploading.

Part C — EC2: launch and backend setup

1. Edit `Backend/deploy/ec2-user-data.sh` and set `REPO_URL` to your repository. Keep `BRANCH` set to `master` if you want AWS to pull from the master branch.

2. Launch an EC2 instance (Ubuntu 22.04 recommended), paste the contents of `ec2-user-data.sh` into the user-data field when creating the instance.
   - Security group suggestions:
     - SSH (22) from your IP only
     - HTTP/HTTPS (80/443) from anywhere if you plan to use Nginx/ALB
     - Postgres (5432) only between EC2 and RDS security groups (do NOT open to public)

3. After boot, SSH into the instance:

```bash
ssh -i /path/to/key.pem ubuntu@ec2-your-ip
cd ~/hotel-crm/Backend
```

4. Create `.env` on the server or use the generator script. Recommended: copy `Backend/.env.prod.example` to `.env` and edit the values.

```bash
cd Backend
cp .env.prod.example .env
# Edit .env with a text editor, or use the generate helper (if you want to pass env vars to populate)
vi .env
```

Or run the helper (if you set env vars in the shell beforehand):

```bash
DATABASE_URL='postgres://postgres:YourStrongPw@rds:5432/aws' \
ALLOWED_ORIGINS='https://d123example.cloudfront.net' \
AWS_REGION=us-east-1 \
./deploy/generate_env.sh
```

5. Install dependencies and start the app with pm2 (the user-data script attempts this automatically):

```bash
npm ci --production
sudo npm install -g pm2
pm2 start src/index.js --name rowdy-cloud-api
pm2 save
pm2 startup systemd
```

6. Confirm the server is listening on the expected port and bound to `0.0.0.0`:

```bash
ss -tlnp | grep 5000
pm2 logs rowdy-cloud-api --lines 200
```

Part D — Set ALLOWED_ORIGINS (CORS)

- In the EC2 `.env` file set `ALLOWED_ORIGINS` to the exact frontend origin. If using CloudFront, use the CloudFront domain. You can include multiple origins separated by commas.
- Example:

```env
ALLOWED_ORIGINS=https://d123example.cloudfront.net,https://your-other-origin
```

Part E — DynamoDB (optional for audit logs)

- Create a table `rowdy-cloud-audit-logs` (single-table simple design recommended in this doc).
- If you create the table, set `AUDIT_DYNAMODB_TABLE` and `AWS_REGION` in the EC2 `.env` and attach an IAM role to the EC2 instance with `dynamodb:PutItem` and `dynamodb:Query` permissions for the table.

Part F — Lambda and EventBridge (optional)

- If you prefer scheduled room sync via Lambda, create a Lambda with runtime Node.js 20, upload `Backend/aws/lambda/roomStatusSync.js` bundled with needed code and set env vars.
- Create an EventBridge rule to trigger the Lambda at your desired interval.

Part G — Verification checklist (perform these manually)

1.  Frontend loads at your S3/CloudFront URL. Network tab shows `env.js` loaded.
2.  Browser console: no CORS errors calling the API.
3.  Login works and returns a session/token as expected.
4.  Guests/Bookings/Rooms list pages load and CRUD operations work.
5.  Backend logs (`pm2 logs`) show successful DB connections and no unhandled exceptions.
6.  If DynamoDB is enabled, confirm audit entries appear in the DynamoDB table.

Rollback plan

- If the new backend fails, use `pm2 stop rowdy-cloud-api` and revert the EC2 instance to the previous snapshot/AMI.
- If the frontend causes issues, re-upload the previous `dist` contents to S3 (keep a copy) and invalidate CloudFront.

Security and best practices reminders

- Never commit secrets into Git. Use `.env` on servers or AWS Secrets Manager.
- For production, prefer RDS for Postgres and IAM roles for EC2 to grant DynamoDB access.
- Use HTTPS in production: configure CloudFront with an ACM certificate.

Developer notes — exact code changes made in this repo for deployment

- `client/public/env.js` added: a runtime file that defines `window.__ENV__`.
- `client/src/js/utils/api.js` modified to read `window.__ENV__` before `import.meta.env` so `VITE_API_BASE_URL` can be changed post-build.
- `Backend/src/index.js` updated to:
  - bind to `0.0.0.0` by default (`HOST` env overrides),
  - print masked `DATABASE_URL` on startup,
  - perform graceful shutdown closing `pool` and stopping the sync interval on SIGINT/SIGTERM.
- `Backend/src/utils/audit.js` optionally writes audit logs to DynamoDB when `AUDIT_DYNAMODB_TABLE` is set (dual-write with Postgres).
- `Backend/aws/lambda/roomStatusSync.js` added so the same sync logic can run as a Lambda.
- Deployment helpers added:
  - `Backend/deploy/ec2-user-data.sh` — user-data automation for EC2 instances (edit `REPO_URL`).
  - `deploy/upload_dist_to_s3.sh` — syncs `client/dist` to S3 and uploads `env.js` with `no-cache`.
  - `Backend/deploy/generate_env.sh` — generate `.env` from `.env.prod.example` using environment variables.
  - `Backend/.env.prod.example` and `Backend/.env.example` added as templates.

Appendix — common commands and checks

- Build frontend:

```bash
cd client
npm ci
npm run build
```

- Upload frontend to S3:

```bash
./deploy/upload_dist_to_s3.sh your-bucket-name us-east-1
```

- Start backend locally for testing:

```bash
cd Backend
npm ci
npm run dev   # uses node --watch
```

- Start backend in production (EC2):

```bash
pm2 start src/index.js --name rowdy-cloud-api
pm2 logs rowdy-cloud-api
```

If you want, I can now:

- Patch `Backend/deploy/ec2-user-data.sh` with your real `REPO_URL` and `BRANCH`.
- Generate a ready `.env` file if you paste your production `DATABASE_URL` and `ALLOWED_ORIGINS` here.
- Walk your teammate through each AWS Console step interactively.

End of guide.

- Guest record: `pk = GUEST#123`, `sk = PROFILE`
