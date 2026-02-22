# MedCare Hospital Management System

A full-stack hospital management application with Firebase Authentication, Firestore Database, and Role-Based Access Control.

## Features

- **Authentication**: Secure login and registration using Firebase Auth.
- **Role-Based Access**:
  - **Patient**: Book appointments, view history.
  - **Doctor**: View assigned appointments, approve/reject requests.
  - **Admin**: Overview of all appointments and system stats.
- **Modern UI**: Glassmorphism design with responsive layout.
- **Real-time Data**: Powered by Firebase Firestore.

## Setup Instructions

1.  **Install Dependencies**:
    ```bash
    cd server
    npm install
    ```

2.  **Start the Server**:
    ```bash
    node index.js
    ```

3.  **Access the App**:
    Open your browser and navigate to `http://localhost:5000`.

## How to Use

1.  **Register**: Click "Login / Register" on the home page.
2.  **Select Role**:
    - Choose **Patient** to book appointments.
    - Choose **Doctor** to manage appointments (Simulated for demo).
    - Choose **Admin** to access the Admin Panel.
3.  **Booking**: Patients can select a specialist and book a slot.
4.  **Management**: Doctors can approve/reject appointments from their dashboard.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript (ES6 Modules).
- **Backend**: Node.js, Express (API & Static File Serving).
- **Database**: Firebase Firestore.
- **Auth**: Firebase Authentication.
- **Payments**: Razorpay Integration (Test Mode).
