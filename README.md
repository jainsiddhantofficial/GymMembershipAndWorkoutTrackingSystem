# GymMembershipAndWorkoutTrackingSystem
A full-stack Gym Management Application built using Spring Boot, designed to manage gym members, trainers, and subscriptions with a modern UI and scalable backend architecture.
# Features
 Member Management (Add, Update, Delete, View)
 Trainer Management
 Subscription & Plan Handling
 REST API Integration
 Modern & Responsive UI
 Fast and Scalable Backend

# Tech Stack
# Backend
Java
Spring Boot
Spring Data JPA (Hibernate)
REST APIs
# Frontend
HTML, CSS, TypeScript
# Database
MySQL 

# Project Architecture
Controller → Service → Repository → Database
Controller → Handles HTTP requests
Service → Business logic
Repository → Database operations

# Project Structure
gym-management/
│── backend/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── model/
│   └── config/
│
│── frontend/
│   ├── components/
│   ├── pages/
│   └── assets/
# Installation & Setup
 Backend Setup
 # Clone repository
git clone https://github.com/your-username/gym-management.git

# Navigate to backend
cd backend

# Run application
mvn spring-boot:run
# Frontend Setup
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start application
npm start

# API Endpoints

| Method | Endpoint      | Description     |
| ------ | ------------- | --------------- |
| GET    | /members      | Get all members |
| POST   | /members      | Add new member  |
| PUT    | /members/{id} | Update member   |
| DELETE | /members/{id} | Delete member   |

# Testing
# Test APIs using Postman
Verify:
  Member creation
  Trainer assignment
  Subscription plans
# Future Improvements
Authentication & Authorization (JWT)
Payment Integration
Admin Dashboard
Analytics & Reports
