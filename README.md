# SiteSort-AI
# 📁 SiteSort AI – Full Stack Web App

## 👋 Project Overview

SiteSort AI is a smart web app built to help **project managers** in the construction industry sort, tag, and retrieve files efficiently using AI. Our app solves the problem of messy folders and scattered documents by using features like:

- 🧠 Smart onboarding + navigation assistant (Sorta)
- 🤖 File upload and auto classification AI
- 💬 Chatbot to retrieve and answer document-related queries
- 📊 Dashboard to show summaries and project insights

---

## 🧠 Tech Stack

| Layer        | Tech Used         |
|--------------|------------------|
| Frontend     | React.js + MUI   |
| Backend      | Express.js (Node) |
| Database     | MongoDB / Sequelize (TBD) |
| AI Features  | OpenAI / Bedrock (TBD) |
| Deployment   | AWS (S3, EB, RDS) |

---

## 🧑‍🤝‍🧑 Team Members & Responsibilities

| Name         | Role                          | Pages/Features |
|--------------|-------------------------------|----------------|
| **Rosnanda** | 🔐 Login, Profile, Sorta (onboarding assistant) | `Login`, `Profile`, auth routes |
| **Jeslyn**   | 📂 File upload + classification AI | `Upload`, upload routes |
| **Zara**     | 💬 Chatbot file retrieval AI | `Assistant`, chat routes |
| **Firmansyah** | 📊 Dashboard insights AI | `Dashboard`, summary routes |

---

## 🗂 Folder Structure & What They Do

### `/client/`
Frontend React code.

#### Key Subfolders:
- `src/pages/`: Each major page (Login, Upload, etc.)
- `src/components/`: Reusable UI components
- `src/contexts/`: Context API (e.g., UserContext for auth)
- `src/http.js`: Axios setup for API requests (with JWT headers)

---

### `/server/`
Backend Express API.

#### 🔹 `routes/`
- **What it does:** Holds all API endpoints like `/login`, `/upload`, `/chat`
- **Example:** When you `GET /api/chat`, it runs the logic in `chatController.js`
- Each file here maps URLs to functions

#### 🔹 `controllers/`
- **What it does:** These contain the **main logic** for handling requests
- Think of it like: if `routes/` is the door, `controllers/` is the room where work happens
- Example: `uploadController.js` handles saving and sorting uploaded files

#### 🔹 `middlewares/`
- **What it does:** These run **before** the controller
- Used for:
  - Checking if user is logged in (`authMiddleware`)
  - Handling file uploads (`uploadMiddleware`)
  - Logging, validation, or permission checks

#### 🔹 `models/`
- **What it does:** Defines your **database structure**
- Example: What a "User" looks like — name, email, password, role, etc.

#### 🔹 `uploads/`
- Holds uploaded files (e.g., PDFs, Excel)

#### 🔹 `utils/`
- AI helper logic like file tagging, summarizing, etc.

---

## 🛠 How We Collaborate

1. **Everyone uses their assigned files**
   - Don’t touch others’ folders unless discussed
2. **Always `git pull` before starting work**
3. **Use VS Code Source Control to commit and push**
4. **Make meaningful commit messages**
5. **Push only tested and working code**

---

## ✅ Setup Instructions

1. Run frontend:
```bash
cd client
npm install
npm run dev

2. Run backend:
cd server
npm install
node index.js

