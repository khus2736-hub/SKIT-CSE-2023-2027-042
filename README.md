# Employee Management and Task Monitoring System (EMS)

**Client:** Amagen Pharma Private Limited  
**Phase:** 1 (Foundation of Enterprise Resource Planning — ERP)  
**Authors:** Khushal Parewa (8230723/23ESKCS120) & Kirti (8230561/23ESKCS122)  
**Target Submission:** February 2027  

---

## 1. Overview & Architecture

This system provides an end-to-end employee management and task monitoring platform consisting of:
- **Database:** MongoDB Community Server (v7+ / v9+) running locally on Windows as a service (`127.0.0.1:27017`), or containerized via Docker.
- **Backend Service:** Spring Boot 3.3.5 (Java 17) REST API with stateless JWT authentication, Spring Data MongoDB, and Bean Validation.
- **Frontend Client:** React 18 single-page application built with Vite, React Router v6, Axios, Recharts, and custom responsive CSS.

---

## 2. Project Directory Layout

```text
Grad Project/
├── docker-compose.yml                # Optional: Standalone MongoDB container configuration
├── README.md                         # Project overview and run guide
├── backend/                          # Spring Boot 3.3 REST API
│   ├── pom.xml
│   ├── README.md
│   ├── .gitignore
│   └── src/
│       └── main/
│           ├── java/com/amagen/ems/
│           │   ├── EmsApplication.java
│           │   ├── config/           # SecurityConfig, CorsConfig, MongoConfig, DataSeeder
│           │   ├── controller/       # Auth, User, Employee, Dept, Desig, Attendance, Leave, Task, Dashboard, Report
│           │   ├── dto/              # Request and Response Java records
│           │   ├── exception/        # Custom exceptions and GlobalExceptionHandler
│           │   ├── model/            # MongoDB documents and enums
│           │   ├── repository/       # Spring Data Mongo repositories
│           │   ├── security/         # JwtService, JwtAuthFilter, CustomUserDetails, SecurityUtils
│           │   ├── service/          # Business logic services
│           │   └── util/             # ResponseMapper, TimeProvider
│           └── resources/
│               └── application.yml
└── frontend/                         # React 18 + Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── README.md
    ├── .env.example
    ├── .gitignore
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── api/                      # Axios client and domain API modules
        ├── components/               # Layout, ProtectedRoute, DataTable, Modal, Field, StatCard...
        ├── context/                  # AuthContext, ToastContext
        ├── pages/                    # Auth, Profile, Admin (Dashboard, Directory, Depts, Leaves...), Employee
        ├── utils/                    # Safe date formatters, secure CSV export
        ├── App.jsx
        ├── main.jsx
        └── index.css                 # Clean, responsive CSS variables design
```

---

## 3. How to Run Locally

### Step 1: Ensure MongoDB is Running

#### Option A: Local Windows Service (Recommended & Installed)
If MongoDB is installed locally as a Windows Service, verify it is running in PowerShell:
```powershell
Get-Service MongoDB
```
If it is stopped, start it:
```powershell
Start-Service MongoDB
```
MongoDB is now active on `127.0.0.1:27017`.

#### Option B: Docker Compose (Alternative)
If using Docker instead of the local Windows service:
```powershell
docker compose up -d
```

---

### Step 2: Start the Backend (Spring Boot 3.3)

In a new terminal:
```powershell
cd "D:\Grad Project\backend"
mvn spring-boot:run
```
The REST API server will start on `http://localhost:8080`.

> [!IMPORTANT]
> **Seeded Administrator Credentials:**
> - **Username:** `admin@amagen.com`
> - **Password:** `Admin@123`
>
> *Note: On first startup, the backend will display:*
> `WARN : Default admin created with email: admin@amagen.com. Change the password immediately!`

---

### Step 3: Start the Frontend (React 18 + Vite)

In a separate terminal:
```powershell
cd "D:\Grad Project\frontend"
npm install
npm run dev
```
The frontend client will start on `http://localhost:5173`. Requests to `/api/*` are automatically proxied to the Spring Boot backend on `http://localhost:8080`.

---

## 4. Default Roles & Testing Walkthrough

1. **Log in as Administrator:**
   - URL: `http://localhost:5173/login`
   - Credentials: `admin@amagen.com` / `Admin@123`
   - Access: View dashboards, manage employees, departments, designations, review leaves, and export analytical CSV reports.

2. **Add an Employee:**
   - Navigate to **Departments** &rarr; Create `Quality Control (QC)`.
   - Navigate to **Designations** &rarr; Create `QC Analyst` under `Quality Control`.
   - Navigate to **Employees** &rarr; Click **+ Add Employee**.
   - Fill in details (e.g. `khushal@amagen.com`, password `Emp@1234`).
   - The system automatically creates both the employee profile (`EMP0001`) and the login user.

3. **Log in as Employee:**
   - Log out from admin and sign in with `khushal@amagen.com` / `Emp@1234`.
   - Click **Check In Now** on the attendance card to record daily presence.
   - Apply for leave under **Leave Applications**.
   - Track and update assigned tasks under **My Tasks**.

4. **Review as Admin:**
   - Log back into `admin@amagen.com`.
   - Approve or reject leave applications with remarks under **Leave Requests**.
   - Inspect daily logged hours under **Attendance**.
   - Export reports to CSV under **Reports**.
