const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const designationRoutes = require("./routes/designationRoutes");

const attendanceRoutes = require("./routes/attendanceRoutes");

const policyRoutes = require("./routes/policyRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const leaveBalanceRoutes = require("./routes/leaveBalanceRoutes");
const assetRoutes = require("./routes/assetRoutes"); 

const appreciationRoutes = require("./routes/appreciationRoutes");
const awardRoutes = require("./routes/awardRoutes");

const complaintRoutes = require("./routes/complaintRoutes");
const warningRoutes = require("./routes/warningRoutes");
const terminationRoutes = require("./routes/terminationRoutes");

const holidayRoutes = require("./routes/holidayRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const activityRoutes = require("./routes/activityRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`[${new Date().toISOString()}] POST ${req.url} - Body:`, req.body);
  }
  next();
});

// Static folder for uploaded images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);

app.use("/api/policies", policyRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use("/api/assets", assetRoutes); 

app.use("/api/appreciations", appreciationRoutes);
app.use("/api/awards", awardRoutes);

app.use("/api/complaints", complaintRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/warnings", warningRoutes);
app.use("/api/terminations", terminationRoutes);

app.use("/api/holidays", holidayRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});