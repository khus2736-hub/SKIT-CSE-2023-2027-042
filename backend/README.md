# Amagen EMS — Backend (Spring Boot 3.3)

Employee Management and Task Monitoring System for Amagen Pharma Private Limited.

## Requirements
- Java 17+
- Maven 3.8+
- MongoDB 7 running on `localhost:27017`

## Configuration
All configuration properties can be overridden with environment variables:
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/amagen_ems`)
- `JWT_SECRET`: Base64 encoded secret key (min 32 bytes)
- `JWT_EXPIRATION_SECONDS`: Token expiration time in seconds (default: 86400 / 24 hours)
- `APP_CORS_ORIGINS`: Allowed frontend origins (default: `http://localhost:5173`)
- `APP_ADMIN_EMAIL`: Seed admin email (default: `admin@amagen.com`)
- `APP_ADMIN_PASSWORD`: Seed admin password (default: `Admin@123`)
- `APP_SEED_SAMPLE_DATA`: Set to `true` to seed sample departments and designations on first startup (default: `false`)

## Running the Application

```bash
mvn spring-boot:run
```

The application runs on `http://localhost:8080`.
The seed administrator credentials on first run:
- **Username:** `admin@amagen.com`
- **Password:** `Admin@123`
*(Change this password immediately upon first login!)*
