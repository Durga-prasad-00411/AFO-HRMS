# 📚 Migrating from MySQL to MongoDB: Complete Guide

This guide covers everything you need to transition your project from a relational **SQL (MySQL)** database to **MongoDB** (a NoSQL database). It explains how to remove your old SQL code, how to connect and code with MongoDB using Mongoose, and how this affects your frontend.

---

## 🛑 Step 1: How to Remove SQL (MySQL)

To get started, you need to strip away the existing MySQL setup from your Node.js backend to prevent conflicts and clean up unnecessary dependencies.

### 1. Uninstall the MySQL driver
Open your terminal, navigate to your `backend` directory, and run the following command to remove the MySQL package:
```bash
npm uninstall mysql2
```

### 2. Delete the MySQL Connection File
Delete or replace the contents of your `backend/config/db.js` file. Currently, this file holds your MySQL connection pool logic using `mysql2`. You will rewrite this file for MongoDB later.

### 3. Clean up `.env` File
Open your `backend/.env` file. You will see SQL-related environment variables like `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.

**Remove these old variables:**
```env
# Delete these from .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdbname
```

---

## 🚀 Step 2: How to Use MongoDB

MongoDB requires a different connection approach. The best way to interact with MongoDB in Node.js is by using an Object Data Modeling (ODM) library called **Mongoose**.

### 1. Install Mongoose
In your `backend` directory, install `mongoose`:
```bash
npm install mongoose
```

### 2. Add MongoDB Connection String to `.env`
Add your local or MongoDB Atlas connection URI to your `backend/.env` file:
```env
# Add this to .env
MONGO_URI=mongodb://127.0.0.1:27017/hrms_db
```

### 3. Create the MongoDB Connection
Rewrite your `backend/config/db.js` to connect to MongoDB instead of MySQL.

#### [NEW] `backend/config/db.js`
```javascript
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.log("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
```

_Note: You'll also need to update your `server.js` to call `connectDB()` when starting the server._

---

## 💻 Step 3: How to Code with MongoDB (Mongoose)

In SQL, you used raw queries (e.g., `SELECT * FROM users`). In MongoDB, you define **Schemas** (the structure of your documents) and **Models** (tools to interact with the database).

### 1. Create a Schema & Model
Create a new folder `backend/models/` and add a schema for your data (e.g., `User.js`).

#### [NEW] `backend/models/User.js`
```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "Employee" },
    department: { type: String }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const User = mongoose.model("User", userSchema);
module.exports = User;
```

### 2. Update Your Controllers (Replacing SQL Queries)
You must replace all your `db.execute(...)` calls in your controllers with Mongoose methods. 

Here is a side-by-side comparison:

#### ❌ The Old SQL Way (What you have now):
```javascript
const db = require('../config/db');

// Get all users
const getUsers = async (req, res) => {
    try {
        const [users] = await db.execute("SELECT * FROM users WHERE role = ?", ["Employee"]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

#### ✅ The New MongoDB Way (What you need to write):
```javascript
const User = require('../models/User'); // Import the Mongoose Model

// Get all users
const getUsers = async (req, res) => {
    try {
        // Mongoose makes fetching data incredibly easy!
        const users = await User.find({ role: "Employee" }); 
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

**Common Mongoose Operations you will use:**
- `User.find()`: Like `SELECT * FROM users`
- `User.findOne({ email: req.body.email })`: Like `SELECT * FROM users WHERE email = ? LIMIT 1`
- `User.findById(req.params.id)`: Like `SELECT * FROM users WHERE id = ?`
- `new User({ ...req.body }).save()`: Like `INSERT INTO users (...)`
- `User.findByIdAndUpdate(id, req.body, { new: true })`: Like `UPDATE users SET ... WHERE id = ?`
- `User.findByIdAndDelete(id)`: Like `DELETE FROM users WHERE id = ?`

---

## 🔗 Step 4: How to Link Backend, Frontend, and MongoDB

The great news is that **changing the database does not change how the React Frontend and Node.js Backend communicate.**

The frontend continues to make HTTP requests (using `fetch` or `axios`) to your backend's REST API endpoints (e.g., `GET /api/users`). 

However, there is **one major difference** you need to handle on the frontend: **The ID Format.**
MySQL uses numeric IDs (`id` or `emp_id`), like `1`, `2`, `3`.
MongoDB automatically assigns a unique string identifier called `_id` to every document, like `64e6b2c8...`.

### How to update the Frontend
Anywhere in your frontend (React) files where you reference the database `id`, you must change it to MongoDB's `_id` format.

#### ❌ Old React Code (SQL style):
```javascript
const fetchEmployee = async (id) => {
    // When looping over SQL data
    employees.map(emp => (
        <tr key={emp.id}>
            <td>{emp.name}</td>
            <td>
                {/* Clicking buttons based on ID */}
                <button onClick={() => deleteEmployee(emp.id)}>Delete</button>
            </td>
        </tr>
    ))
}
```

#### ✅ New React Code (MongoDB style):
```javascript
const fetchEmployee = async (id) => {
     // Loop over Mongo data (note the underscore: _id)
    employees.map(emp => (
        <tr key={emp._id}>
            <td>{emp.name}</td>
            <td>
                {/* Clicking buttons based on _id */}
                <button onClick={() => deleteEmployee(emp._id)}>Delete</button>
            </td>
        </tr>
    ))
}
```

> [!CAUTION]
> If you have existing relationships in MySQL (like a `LeaveRequest` having an `employee_id`), in MongoDB you will save the User's `_id` inside the `LeaveRequest` document. You can then use Mongoose's `.populate("employee_id")` feature to automatically fetch the related user data, replacing SQL `JOIN` statements.

---

## Summary Checklist

1. [ ] **Uninstall** `mysql2` and clean your `.env` variables.
2. [ ] **Install** `mongoose` and add your `MONGO_URI` to `.env`.
3. [ ] **Rewrite** `backend/config/db.js` to connect using Mongoose.
4. [ ] **Create** Mongoose Schemas/Models in a `backend/models/` directory for every table you used to have.
5. [ ] **Refactor** your Controllers to import Models and use `.find()`, `.save()`, etc. instead of raw `INSERT` or `SELECT` queries.
6. [ ] **Update Frontend** components to look for the property `_id` instead of `id` when interacting with the API data.
