# AFO-HRMS (Automated Full-stack Office - Human Resource Management System)

AFO-HRMS is a robust, professional-grade Human Resource Management System designed to streamline office operations. Built with modern technologies, it provides a comprehensive suite of tools for employee management, attendance, payroll, and more, all within a secure and scalable architecture.

---

## 🏗 Project Structure

The project is organized into two main directories: **backend** (Server & API) and **frontend** (User Interface).

```text
AFO-HRMS/
│
├── backend/                  # Server-side logic (Node.js & Express)
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Business logic for API endpoints
│   ├── middleware/           # Auth and validation middleware
│   ├── routes/               # API route definitions
│   ├── utils/                # Helper functions and utilities
│   ├── uploads/              # Storage for images/documents
│   ├── server.js             # Main server entry point
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/                 # Client-side logic (React & Vite)
│   ├── public/               # Static assets
│   ├── src/                  # Application source code
│   ├── index.html            # Main HTML entry point
│   ├── package.json          # Frontend dependencies and scripts
│   └── vite.config.js        # Vite configuration
│
├── database_queries.sql      # Database schema and seed data
├── README.md                 # This documentation
└── .gitignore                # Files excluded from Version Control
```

---

## 🛠 Tech Stack

*   **Frontend**: React.js, Vite, Material UI (MUI), Emotion, React Icons.
*   **Backend**: Node.js, Express.js.
*   **Database**: MySQL (relational database management).
*   **Authentication**: JSON Web Token (JWT) and Bcrypt for secure password hashing.
*   **File Handling**: Multer for image and document uploads.

---

## 🚀 Getting Started (Setup Instructions)

Follow these steps to set up the project on your local machine for the first time.

### 1. System Requirements (Prerequisites)
Before you begin, ensure your machine has the following tools installed:
*   **Node.js**: [Download here (v18+)](https://nodejs.org/)
*   **npm**: Included with Node.js.
*   **MySQL Server**: [Download here (v8.0+)](https://dev.mysql.com/downloads/installer/)

---

### 2. Initial Setup
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Durga-prasad-00411/AFO-HRMS.git
    cd AFO-HRMS
    ```

---

### 3. Database Configuration
1.  Open your **MySQL Workbench** or any SQL terminal.
2.  Create the database:
    ```sql
    CREATE DATABASE hrms;
    ```
3.  Import the schema:
    *   Open the `database_queries.sql` file located in the root directory.
    *   Copy and run the code within the file to generate all necessary tables and seed data.

---

### 4. Backend Configuration
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    npm install
    ```
2.  Create a `.env` file in the `backend/` folder and configure your sensitive details:
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_NAME=hrms
    JWT_SECRET=afo_hrms_secure_token_2024
    ```
    *(Note: Replace `your_mysql_password` with your actual MySQL password).*
3.  **Start the server**:
    ```bash
    npm run dev
    ```

---

### 5. Frontend Configuration
1.  Open a **new** terminal window and navigate to the `frontend/` directory:
    ```bash
    cd frontend
    npm install
    ```
2.  **Start the development server**:
    ```bash
    npm run dev
    ```
3.  Access the application:
    *   **Dashboard**: `http://localhost:5173`

---

## 🔥 Key Features Explained

*   **Role-Based Access Control (RBAC)**: Different interfaces and permissions for SuperAdmin, Admin, Manager, and Employees.
*   **Employee Lifecycle**: Full management from onboarding to termination.
*   **Geolocation Attendance**: Employees can clock-in/out with location validation to ensure they are at the correct site.
*   **Payroll Optimization**: Automated salary generation, tax/PF deductions, and digital payslips.
*   **Asset Management**: Track company assets allocated to employees.
*   **Leave Workflow**: Streamlined leave application and multi-level approval system.

---

## 📜 Professional Note
This project is built to demonstrate a clean folder structure, secure API development, and a responsive frontend design suitable for production environments.

