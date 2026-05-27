# Hotel CRM

A comprehensive Hotel Customer Relationship Management system built with React, Express, and PostgreSQL.

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
