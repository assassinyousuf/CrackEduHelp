# CreackEduHelp: Academic Support & Productivity Platform

CreackEduHelp is an enterprise-grade, production-ready web platform that connects students with academic support specialists for ethical educational services (presentation layout design, report formatting, proofreading, citation support, and syntax checking). 

The platform is strictly positioned as an **Academic Support & Productivity Service**, prohibiting exam-taking, cheating, impersonation, or credential sharing.

---

## Technical Stack
- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (Express), TypeScript, Sequelize ORM.
- **Database**: PostgreSQL (production), SQLite (local development).

---

## Ethical & Service Policies

### Allowed Support Services:
- **Presentation Design**: Designing slide layouts, styling slides, and formatting slide structures.
- **Academic Report Formatting**: Aligning margins, page numbering, creating tables of contents, and formatting styling templates.
- **Research Assistance**: Literature outlines, citation indexes, and reference guide compilations.
- **Proofreading & Editing**: Reviewing grammar, phrasing flow, vocabulary, and active/passive syntax check.
- **Referencing & Citation Support**: Reviewing APA, Harvard, Chicago, IEEE, Oxford styles.
- **Data Analysis Assistance**: Visualizing data charts, structuring tables, formatting graph layouts.
- **Programming Support**: Code syntax debugging, styling guides, refactoring suggestions, and documentation.
- **Academic Document Design**: LaTeX layout tuning, margins adjustments, font matching.

### Prohibited Services:
- Taking exams or quizzes on behalf of students.
- Writing original essays/assignments (Academic Impersonation / Ghost-writing).
- Sharing portal credentials or login tokens.
- Plagiarism support, or any fraudulent academic activities.

---

## Escrow-based Business Model
1. **Submit Request**: Student registers, fills in outline details, and uploads guidelines. Pydantic validates input for ethical keywords.
2. **Review & Quote**: System calculates base quote dynamically. Administrators can manually override quotes based on details.
3. **Pay 30% Deposit**: Student transfers deposit (manual UK transfer, Wise, or PayPal) and uploads receipt screenshots. Admin approves.
4. **Specialist Assignment**: Admin assigns a qualified Specialist. Specialist starts work (status moves to "In Progress").
5. **Milestone Progress**: Specialist uploads draft files for student feedback. Discussions take place in real-time order chat.
6. **Final Deliverable**: Specialist uploads the final work. Student pays the remaining 70% balance. When approved, delivery files unlock.

---

## Pre-seeded Credentials
For review and testing, startup seeding registers the following credentials automatically:

### 1. System Administrator
- **Email**: `admin@creackeduhelp.com`
- **Password**: `adminpass123`
- **Dashboard**: `http://localhost/admin`

### 2. Specialist Provider
- **Email**: `specialist@creackeduhelp.com`
- **Password**: `specpass123`
- **Dashboard**: `http://localhost/specialist`

### 3. Students and Ambassadors
- Can self-register on the frontend panel: `http://localhost/register`.
- Referral URL format: `http://localhost/register?ref=REF-XXXXXX` (Ambassador dashboard generates links).

---

## Launch Instructions (Local Setup)

### 1. Start the Backend
Navigate to the `backend` folder, install dependencies, and start the server:
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:8000`. On startup, it synchronizes the database (creating a local SQLite `eduhelp_dev.db` file) and seeds the default admin and specialist accounts.

### 2. Start the Frontend
Navigate to the `frontend` folder, install dependencies, and start Next.js:
```bash
cd frontend
npm install
npm run dev
```
The frontend runs on `http://localhost:3000`. To point the frontend to the local backend server, create `frontend/.env.local` containing:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Running Automated Tests

To execute the backend integration test suite (using an in-memory SQLite database):
```bash
cd backend
npm run test
```
