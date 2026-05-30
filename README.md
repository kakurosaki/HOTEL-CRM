# Rowdy Cloud

A comprehensive Hotel Customer Relationship Management system built with React, Express, and PostgreSQL, prepared for AWS deployment with an S3-hosted frontend, an EC2-hosted API, and a Lambda-powered room-status sync.

For the step-by-step AWS setup guide, see [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md).

## Setup Instructions

### 1. Database Setup

First, create the PostgreSQL database and tables:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (if not exists)
CREATE DATABASE aws;

# Connect to the database
\c aws

# Run the schema file to create tables and seed data
\i Backend/schema.sql
```

### 2. Backend Setup

```bash
cd Backend
npm install

# Create .env file with your database connection
# Update DATABASE_URL in Backend/.env if needed

# Run the development server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
npm install

# Run the development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## AWS Deployment Pattern

Use this topology for the cloud version of the project:

1. Host the React build on S3 as a static website.
2. Deploy the Express API to EC2.
3. Set `VITE_API_BASE_URL` in the frontend to the EC2 or CloudFront API endpoint.
4. Set `ALLOWED_ORIGINS` or `FRONTEND_ORIGIN` in the backend to the S3 or CloudFront URL.
5. Schedule the room-status sync Lambda with EventBridge if you want the automation to run outside the API process.

Recommended environment variables:

- `DATABASE_URL` for the backend database connection.
- `PORT` for the backend listener port.
- `ALLOWED_ORIGINS` for comma-separated frontend origins.
- `VITE_API_BASE_URL` for the client API prefix when the frontend is served from S3/CloudFront.
- `AUDIT_DYNAMODB_TABLE` for optional DynamoDB audit-log storage.
- `AWS_REGION` for the AWS SDK runtime region when using DynamoDB or Lambda.

Suggested AWS extras:

- CloudFront in front of the S3 site for HTTPS and caching.
- CloudTrail for auditing AWS account activity.
- DynamoDB for AWS-side metadata or audit mirrors if you extend the storage layer later.

## Login Credentials

- **Username:** admin
- **Password:** admin123

## Features Implemented

### ✅ Forms & Buttons (Current)

- Add Guest form with validation
- New Booking form with guest and room selection
- Search and filter functionality
- Input validation with error messages

### ✅ Backend Routes

- `/api/guests` - Guest CRUD operations
- `/api/bookings` - Booking CRUD operations
- `/api/rooms` - Room management
- `/api/dashboard` - Dashboard statistics
- `/api/login` - User authentication
- Lambda entrypoint: `Backend/aws/lambda/roomStatusSync.js`

### 🔄 In Progress

- Dashboard with statistics and charts
- Rooms management page
- Register functionality

## Project Structure

```
HOTEL-CRM/
├── Backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   └── routes/
│   │       ├── login.js
│   │       ├── guests.js
│   │       ├── bookings.js
│   │       ├── rooms.js
│   │       └── dashboard.js
│   ├── schema.sql
│   ├── package.json
│   └── .env
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── css/
│   │   └── js/
│   │       ├── components/
│   │       │   ├── login.jsx
│   │       │   ├── dashboardLayout.jsx
│   │       │   ├── AddGuestModal.jsx
│   │       │   └── NewBookingModal.jsx
│   │       └── pages/
│   │           ├── DashboardPage.jsx
│   │           ├── GuestsPage.jsx
│   │           ├── BookingsPage.jsx
│   │           └── RoomsPage.jsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Next Steps

1. Test the Add Guest button and form validation
2. Test the New Booking button and form validation
3. Implement Dashboard page
4. Implement Rooms management page
5. Implement Register page
