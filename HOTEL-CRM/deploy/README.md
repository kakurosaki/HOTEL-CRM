Deployment helper scripts

This folder contains simple helper scripts to assist with deploying the project to AWS.

Files

- `Backend/deploy/ec2-user-data.sh` — a cloud-init / user-data script that:
  - installs Node.js and required packages
  - clones the repo (replace `REPO_URL` inside the script or pass via cloud-init)
  - runs `npm ci` in `Backend`
  - creates a `.env` from `.env.example` if missing
  - installs `pm2` and starts the backend

- `deploy/upload_dist_to_s3.sh` — an AWS CLI helper to sync `client/dist` to an S3 bucket and upload `env.js` with `Cache-Control: no-cache` so runtime changes take effect immediately.

Usage notes

1. Prepare your repository URL and values.

2. Edit `Backend/deploy/ec2-user-data.sh` and set `REPO_URL` to your repo. If your repo is private, configure deploy keys or use a public repo.

3. Launch an EC2 instance and paste the contents of `ec2-user-data.sh` into the user-data field (or use the file as a cloud-init script). After boot the instance will clone and start the app.

4. Build the frontend locally, then run:

```bash
./deploy/upload_dist_to_s3.sh your-bucket-name us-east-1
```

5. After uploading, create/edit `env.js` at the bucket root to set `VITE_API_BASE_URL` (CloudFront domain or API URL). Example:

```html
<script>
  window.__ENV__ = { VITE_API_BASE_URL: "https://api.yourdomain.com" };
</script>
```

Security reminders

- Do not bake secrets into the user-data script. Prefer to edit `.env` on the EC2 instance after boot or use AWS SSM Parameter Store / Secrets Manager.
- Restrict the EC2 security group and RDS access to only the necessary IPs or SGs.
