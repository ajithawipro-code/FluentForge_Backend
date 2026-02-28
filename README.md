# FluentForge – Backend API

## Project Overview

FluentForge Backend is a RESTful API built using Node.js (ES Modules) and Express, integrated with Supabase (PostgreSQL).

It powers a structured language learning platform featuring:

- Secure JWT-based authentication
- Sequential module and lesson unlocking
- XP and streak-based gamification
- Score evaluation and progress tracking
- Daily XP analytics aggregation
- Flashcard revision system

The backend follows a modular MVC-inspired architecture with clean separation of routes, controllers, middleware, and utilities.

---

## Tech Stack

- Node.js (ES Modules)
- Express.js
- Supabase (PostgreSQL)
- JWT Authentication
- bcrypt (Password Hashing)
- CORS
- dotenv

---

## Backend Architecture

### Folder Structure

backend/
│
├── src/
│ ├── controllers/
│ ├── routes/
│ ├── middleware/
│ ├── config/
│ ├── utils/
│
└── server.js


### Request Lifecycle

Client → Route → Controller → Supabase → Response

Each route delegates business logic to its respective controller. Controllers handle validation, business rules, database interaction, and structured responses.

---

## Authentication

### POST /auth/signup

- Manual input validation
- Password hashing using bcrypt
- User creation in Supabase

### POST /auth/login

- Credential validation
- Password comparison
- JWT token generation
- Returns token and user object

Protected routes require:

Authorization: Bearer <JWT_TOKEN>


Authentication is handled via custom middleware (`authenticate`).

---

## Learning APIs

### GET /learning/modules

Returns:

- Modules for the user's selected language
- Progress percentage per module
- Locked/unlocked status
- Ordered by display_order

Progress is calculated dynamically using lessons and user_progress tables.

---

### GET /learning/lessons/:moduleId

Performs:

- Module validation
- Previous module completion check
- Lesson-level locking logic
- Returns ordered lessons with `locked` flag

---

### GET /learning/questions/:lessonId

Performs:

- Lesson existence validation
- Sequential lesson unlock validation
- Returns lesson details and associated questions

Note: `correct_answer` stores the actual correct option text.

---

## Progress & Gamification

### POST /progress/submitProgress

Core gamification logic:

- Evaluates submitted answers
- Calculates score
- Calculates XP earned
- Updates user_progress
- Updates users.total_xp
- Updates streak_count
- Stores completed_at timestamp

---

### GET /progress/dashboard

Returns:

- totalXp
- streak
- completionPercentage
- Gamification summary data

Used by the dashboard page.

---

## Analytics

### GET /analytics

Returns:

- totalXp
- streak
- lessonsCompleted
- XP timeline grouped by completion date

XP is aggregated per day using completed_at timestamps and lesson XP values.

---

## Flashcards

### GET /flashcard/flashcards/:lessonId

Returns flashcards associated with a lesson for revision purposes.

---

## Database Schema

### users
- id (UUID)
- name
- email (unique)
- password (hashed)
- total_xp
- streak_count
- language_id (FK)
- created_at

### languages
- id
- name

### modules
- id
- title
- level
- display_order
- language_id (FK)

### lessons
- id
- module_id (FK)
- title
- content
- xp
- order

### questions
- id
- lesson_id (FK)
- question
- option_a
- option_b
- option_c
- option_d
- correct_answer

### user_progress
- id
- user_id (FK)
- lesson_id (FK)
- completed
- score
- completed_at

### flashcards
- id
- lesson_id (FK)
- front_text
- back_text

All tables maintain proper foreign key relationships.

---

## Security & Validation

- Password hashing using bcrypt
- JWT-based route protection
- Manual request validation
- Centralized error handling with try/catch
- Proper HTTP status codes
- Controlled CORS configuration

---

## Local Installation

### 1. Clone Repository

git clone <repo-url>
cd backend


### 2. Install Dependencies

npm install

### 3. Create .env file

PORT=5000
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
JWT_SECRET=your_secret


### 4. Run Server

npm run dev


### 5. Server runs on:

http://localhost:5000


---

## Deployment

Backend deployed on Render:

https://fluentforge-backend.onrender.com

---

## Engineering Highlights

- Sequential learning enforcement
- Dynamic progress computation
- Centralized XP and streak engine
- Date-wise XP aggregation
- Flashcard revision module
- Modular architecture
- Supabase relational integrity
- Production-ready deployment






