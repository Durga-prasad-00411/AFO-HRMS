# HRMS BACKEND - FULL SOURCE CODE

This document contains the complete source code for the backend of the HRMS system.

---

## Server Entry Point

### `backend/server.js`
```javascript
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
```

---

## Configuration

### `backend/config/db.js`
```javascript
const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
});

const db = pool.promise();

pool.getConnection((err, conn) => {
    if (err) {
        console.log("❌ MySQL Connection Failed:", err.message);
    } else {
        console.log("✅ MySQL Connected Successfully");
        conn.release();
    }
});

module.exports = db;
```

---

## Middleware

### `backend/middleware/authMiddleware.js`
```javascript
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "Access Denied. No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;   // user info saved
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};


/* ROLE AUTHORIZATION (FIXED VERSION) */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.user)
      return res.status(403).json({ message: "User not authenticated" });

    // Convert both to uppercase to avoid case mismatch
    const userRole = req.user.role?.toUpperCase();
    const allowedRoles = roles.map(role => role.toUpperCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Access Forbidden: Insufficient role"
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};
```

---

### `backend/middleware/complaintmiddleware.js`
```javascript
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
```

---

### `backend/middleware/uploadAsset.js`
```javascript
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
```

---

### `backend/middleware/uploadAward.js`
```javascript
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

module.exports = upload;
```

---

### `backend/middleware/uploadMiddleware.js`
```javascript
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads/employees";

/* create folder automatically */
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
```

---

### `backend/middleware/uploadPolicy.js`
```javascript
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./uploads/policies/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (ext) {
    cb(null, true);
  } else {
    cb("Only PDF/DOC files are allowed!");
  }
};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;
```

---

### `backend/middleware/uploadWarning.js`
```javascript
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = "uploads/warnings/";

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpg|jpeg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb("Only JPG, PNG, PDF allowed");
};

module.exports = multer({ storage, fileFilter });
```

---

## Controllers

### `backend/controllers/activityController.js`
```javascript
const db = require('../config/db');

exports.addActivity = async (activity_type, activity_text, color) => {
    try {
        await db.query(
            "INSERT INTO recent_activities (activity_type, activity_text, color) VALUES (?, ?, ?)",
            [activity_type, activity_text, color || '#3b82f6']
        );
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};

```

---

### `backend/controllers/appreciationController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");


exports.addAppreciation = async (req, res) => {
  try {
    const {
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description
    } = req.body;

    const sql = `
      INSERT INTO appreciations
      (employee_name, employee_id, award_title, award_date, award_type, award_period, given_by, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description || null
    ]);

    res.json({ message: "Appreciation added successfully" });
    await addActivity('APPRECIATION', `New appreciation for <b>${employeeName}</b>: ${awardTitle}`, '#10b981');
  } catch (err) {
    console.error("Add Appreciation Error: ", err);
    res.status(500).json({ error: err.message });
  }
};




exports.getAppreciations = async (req, res) => {
  try {
    const sql = "SELECT * FROM appreciations ORDER BY id DESC";
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



exports.getAppreciationById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM appreciations WHERE id = ?";
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ message: "Appreciation not found" });
    }
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



exports.deleteAppreciation = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM appreciations WHERE id=?";
    await db.query(sql, [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAppreciation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description
    } = req.body;

    const sql = `
      UPDATE appreciations
      SET employee_name = ?, employee_id = ?, award_title = ?, award_date = ?, award_type = ?, award_period = ?, given_by = ?, description = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description || null,
      id
    ]);

    res.json({ message: "Appreciation updated successfully" });
  } catch (err) {
    console.error("Update Appreciation Error: ", err);
    res.status(500).json({ error: err.message });
  }
};
```

---

### `backend/controllers/assetAllocationController.js`
```javascript
const db = require("../config/db");

exports.allocateAsset = async (req, res) => {
    console.log("Allocate API hit");
    console.log("Request Body:", req.body);

    const rawEmployeeId = req.body.employeeId;
    const rawAssetId = req.body.assetId;
    const rawAssetType = req.body.assetType;
    const rawAllocationDateTime = req.body.allocationDateTime;
    const condition = req.body.condition;
    const description = req.body.description;

    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim() : "";
    const assetId = rawAssetId ? String(rawAssetId).trim() : "";
    const assetType = rawAssetType ? String(rawAssetType).trim() : "";
    const allocationDateTime = rawAllocationDateTime
        ? String(rawAllocationDateTime).replace("T", " ").length === 16
            ? String(rawAllocationDateTime).replace("T", " ") + ":00"
            : String(rawAllocationDateTime).replace("T", " ")
        : "";

    if (!employeeId || !allocationDateTime || (!assetId && !assetType)) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    try {
        // 1️⃣ Check Employee Exists
        const employeeQuery = `
            SELECT id
            FROM employees
            WHERE employee_code = ?
               OR id = ?
               OR user_id = ?
            LIMIT 1
        `;
        const [empResult] = await db.execute(employeeQuery, [employeeId, employeeId, employeeId]);

        if (empResult.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const empDbId = empResult[0].id;

        // 2️⃣ Get Asset ID using exact ID if provided, or fallback to any unallocated asset_type
        let assetDbId;

        if (assetId) {
            const assetQuery = "SELECT id FROM assets WHERE id = ? AND id NOT IN (SELECT asset_id FROM asset_allocations)";
            const [assetResult] = await db.execute(assetQuery, [assetId]);
            if (assetResult.length === 0) {
                return res.status(404).json({ message: "Asset not found or already allocated" });
            }
            assetDbId = assetResult[0].id;
        } else {
            const assetQuery = "SELECT id FROM assets WHERE asset_type = ? AND id NOT IN (SELECT asset_id FROM asset_allocations) LIMIT 1";
            const [assetResult] = await db.execute(assetQuery, [assetType]);

            if (assetResult.length === 0) {
                return res.status(404).json({ message: "No unallocated asset of this type found" });
            }

            assetDbId = assetResult[0].id;
        }

        // 3️⃣ Insert Allocation
        const insertQuery = `
      INSERT INTO asset_allocations
      (asset_id, employee_id, allocation_datetime, asset_condition, description)
      VALUES (?, ?, ?, ?, ?)
    `;

        const [result] = await db.execute(insertQuery, [
            assetDbId,
            empDbId,
            allocationDateTime,
            condition || null,
            description || null,
        ]);

        return res.status(201).json({
            success: true,
            message: "Asset allocated successfully",
            id: result.insertId,
        });
    } catch (error) {
        console.error("Allocation Error:", error);
        return res.status(500).json({ message: "Database or Allocation error" });
    }
};

```

---

### `backend/controllers/assetController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");


// ================= ADD ASSET =================
exports.addAsset = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      assetName,
      assetType,
      location,
      description,
      accountNumber,
      purchaseDate,
      price,
    } = req.body;

    if (
      !assetName ||
      !assetType ||
      !location ||
      !accountNumber ||
      !purchaseDate ||
      !price
    ) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    const image = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO assets
      (asset_name, asset_type, location, description, account_number, purchase_date, price, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      assetName,
      assetType,
      location,
      description || null,
      accountNumber,
      purchaseDate,
      price,
      image,
    ]);

    await addActivity('ASSET', `New asset added: <b>${assetName}</b>`, '#06b6d4');

    return res.status(201).json({
      success: true,
      message: "Asset stored successfully",
    });

  } catch (error) {
    console.error("ADD ASSET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= GET ALL ASSETS =================
exports.getAssets = async (req, res) => {
  try {

    const [rows] = await db.execute(`
      SELECT 
        assets.id,
        assets.asset_name,
        assets.asset_type,
        assets.image,
        CONCAT(employees.first_name, ' ', employees.last_name) AS allocatedTo,
        assets.location,
        assets.price,
        assets.purchase_date,
        assets.description,
        assets.account_number,
        assets.created_at,
        assets.updated_at

      FROM assets

      LEFT JOIN asset_allocations
        ON assets.id = asset_allocations.asset_id

      LEFT JOIN employees
        ON asset_allocations.employee_id = employees.id

      ORDER BY assets.id ASC
    `);

    return res.status(200).json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error("GET ASSETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching assets",
      error: error.message,
    });
  }
};

// ================= GET ASSET BY ID =================
exports.getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`
      SELECT * FROM assets WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("GET ASSET BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ================= DELETE ASSET =================
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM assets WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    return res.status(200).json({
      message: "Asset deleted successfully",
    });

  } catch (error) {
    console.error("DELETE ASSET ERROR:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= UPDATE ASSET =================
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { assetName, assetType, location, description, accountNumber, purchaseDate, price } = req.body;

    if (!assetName || !assetType || !location || !accountNumber || !purchaseDate || !price) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const image = req.file ? req.file.filename : null;

    let sql = `
      UPDATE assets
      SET asset_name = ?, asset_type = ?, location = ?, description = ?, account_number = ?, purchase_date = ?, price = ?
    `;

    const params = [assetName, assetType, location, description, accountNumber, purchaseDate, price];

    if (image) {
      sql += `, image = ?`;
      params.push(image);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await db.execute(sql, params);

    await addActivity('ASSET', `Asset updated: <b>${assetName}</b>`, '#f59e0b');

    return res.status(200).json({ success: true, message: "Asset updated successfully" });

  } catch (error) {
    console.error("UPDATE ASSET ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
```

---

### `backend/controllers/attendanceController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");

const OFFICE_LAT          = parseFloat(process.env.OFFICE_LAT)          || 17.4483;
const OFFICE_LONG         = parseFloat(process.env.OFFICE_LONG)         || 78.3915;
const OFFICE_RADIUS_METERS = parseInt(process.env.OFFICE_RADIUS_METERS) || 100;
const WFH_RADIUS_METERS    = 100; // Fixed 100m radius from employee's registered home

// ── Haversine distance (metres) ──────────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const f1 = lat1 * Math.PI / 180;
  const f2 = lat2 * Math.PI / 180;
  const df = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a  = Math.sin(df/2)**2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Helper: fetch employee profile (work_type + home coords) ─────────────────
// Gracefully falls back to OFFICE defaults if migration hasn't been run yet
async function getEmployeeProfile(userId) {
  const fallback = { work_type: 'OFFICE', home_lat: null, home_long: null };
  try {
    const [rows] = await db.execute(
      `SELECT
         COALESCE(e.work_type, 'OFFICE') AS work_type,
         e.home_lat,
         e.home_long
       FROM employees e
       WHERE e.user_id = ?
       LIMIT 1`,
      [userId]
    );
    return rows.length > 0 ? rows[0] : fallback;
  } catch (err) {
    // Columns don't exist yet (migration pending) – fall back to OFFICE
    console.warn('[attendance] getEmployeeProfile fallback (run migration):', err.code);
    return fallback;
  }
}

// ── Geo-fence helpers ───────────────────────────────────────────────────────
function isAtOffice(lat, lon) {
  return getDistance(OFFICE_LAT, OFFICE_LONG, lat, lon) <= OFFICE_RADIUS_METERS;
}
function isAtHome(lat, lon, homeLat, homeLong, radiusMeters) {
  return getDistance(homeLat, homeLong, lat, lon) <= radiusMeters;
}

exports.addManualAttendance = async (req, res) => {
  try {
    const { employeeCode, date, inTime, outTime } = req.body;

    const [employees] = await db.execute(
      "SELECT user_id FROM employees WHERE employee_code = ?",
      [employeeCode]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const userId = employees[0].user_id;
    let status = outTime ? "CHECKED_OUT" : "CHECKED_IN";
    const [existing] = await db.execute(
      "SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, date]
    );

    if (existing.length > 0) {
      await db.execute(
        "UPDATE attendance SET check_in = ?, check_out = ?, status = ? WHERE id = ?",
        [inTime || null, outTime || null, status, existing[0].id]
      );
      return res.status(200).json({ success: true, message: "Attendance updated successfully" });
    } else {
      const [result] = await db.execute(
        "INSERT INTO attendance (user_id, attendance_date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)",
        [userId, date, inTime || null, outTime || null, status]
      );
      return res.status(201).json({ success: true, message: "Attendance added successfully", id: result.insertId });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today  = new Date().toISOString().split('T')[0];
    const now    = new Date().toTimeString().split(' ')[0];

    // ── Already checked in today? ────────────────────────────────────────────
    const [existing] = await db.execute(
      "SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, today]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    const profile = await getEmployeeProfile(userId);
    const { work_type: workType, home_lat, home_long } = profile;
    const { location, work_mode: requestedMode } = req.body;

    let resolvedWorkMode = 'OFFICE';
    let lat = null, lon = null;

    // ── Rule engine per work type ────────────────────────────────────────────
    if (workType === 'WFH') {
      // WFH: must be within registered home location radius
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required for WFH attendance verification."
        });
      }
      if (!home_lat || !home_long) {
        return res.status(403).json({
          message: "Your home location has not been registered. Please contact HR to set up your WFH address."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
      if (!isAtHome(lat, lon, home_lat, home_long, WFH_RADIUS_METERS)) {
        const dist = Math.round(getDistance(home_lat, home_long, lat, lon));
        return res.status(403).json({
          message: `Check-in denied. You are ${dist}m away from your registered home address. WFH check-in must be within ${WFH_RADIUS_METERS}m of your home.`
        });
      }
      resolvedWorkMode = 'WFH';

    } else if (workType === 'OFFICE') {
      // OFFICE: location mandatory + must be within office geo-fence
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required for Office employees."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
      if (!isAtOffice(lat, lon)) {
        const dist = Math.round(getDistance(OFFICE_LAT, OFFICE_LONG, lat, lon));
        return res.status(403).json({
          message: `Check-in denied. You are ${dist}m away from the office. Office employees must check in within ${OFFICE_RADIUS_METERS}m of the office.`
        });
      }
      resolvedWorkMode = 'OFFICE';

    } else if (workType === 'HYBRID') {
      // HYBRID: employee picks mode each day
      //   OFFICE mode → office geo-fence
      //   WFH mode    → home location geo-fence
      const chosenMode = (requestedMode || 'OFFICE').toUpperCase();

      if (chosenMode === 'OFFICE') {
        if (!location?.latitude || !location?.longitude) {
          return res.status(400).json({
            message: "Location access is required when checking in from Office."
          });
        }
        lat = location.latitude;
        lon = location.longitude;
        if (!isAtOffice(lat, lon)) {
          const dist = Math.round(getDistance(OFFICE_LAT, OFFICE_LONG, lat, lon));
          return res.status(403).json({
            message: `Check-in denied. You are ${dist}m from the office. Select 'Work From Home' or move closer to the office.`
          });
        }
        resolvedWorkMode = 'OFFICE';

      } else {
        // Hybrid WFH day – validate against registered home
        if (!location?.latitude || !location?.longitude) {
          return res.status(400).json({
            message: "Location access is required for WFH verification."
          });
        }
        if (!home_lat || !home_long) {
          return res.status(403).json({
            message: "Your home location is not registered. Please contact HR to enable WFH check-in."
          });
        }
        lat = location.latitude;
        lon = location.longitude;
        if (!isAtHome(lat, lon, home_lat, home_long, WFH_RADIUS_METERS)) {
          const dist = Math.round(getDistance(home_lat, home_long, lat, lon));
          return res.status(403).json({
            message: `WFH check-in denied. You are ${dist}m from your registered home address (allowed: ${WFH_RADIUS_METERS}m).`
          });
        }
        resolvedWorkMode = 'WFH';
      }
    }

    // ── Save attendance record ─────────────────────────────────────────────
    // Try with work_mode column first; fall back to old schema if not migrated
    try {
      await db.execute(
        `INSERT INTO attendance
           (user_id, attendance_date, check_in, latitude, longitude, status, work_mode)
         VALUES (?, ?, ?, ?, ?, 'CHECKED_IN', ?)`,
        [userId, today, now, lat, lon, resolvedWorkMode]
      );
    } catch (insertErr) {
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        // work_mode column doesn't exist yet – use old schema
        await db.execute(
          `INSERT INTO attendance
             (user_id, attendance_date, check_in, latitude, longitude, status)
           VALUES (?, ?, ?, ?, ?, 'CHECKED_IN')`,
          [userId, today, now, lat, lon]
        );
      } else {
        throw insertErr;
      }
    }

    const [empRows] = await db.query(
      "SELECT first_name, last_name FROM employees e JOIN users u ON e.user_id = u.id WHERE u.email = ?",
      [req.user.email]
    );
    const empName = empRows.length > 0
      ? `${empRows[0].first_name} ${empRows[0].last_name}`
      : `User ID ${userId}`;

    const modeLabel = resolvedWorkMode === 'WFH' ? '🏠 WFH' : '🏢 Office';
    await addActivity('ATTENDANCE', `Employee checked in (${modeLabel}): <b>${empName}</b>`, '#10b981');

    res.json({
      success: true,
      message: `Checked in successfully (${modeLabel})`,
      time: now,
      work_mode: resolvedWorkMode,
      work_type: workType
    });
  } catch (err) {
    console.error("Check-in Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today  = new Date().toISOString().split('T')[0];
    const now    = new Date().toTimeString().split(' ')[0];

    const [existing] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ? AND status = 'CHECKED_IN'",
      [userId, today]
    );
    if (existing.length === 0) {
      return res.status(400).json({ message: "No active check-in found for today" });
    }

    const record   = existing[0];
    // work_mode may be null if migration hasn't been run; default to OFFICE behaviour
    const workMode = record.work_mode || 'OFFICE';

    const { location } = req.body;
    let lat = null, lon = null;

    if (workMode === 'OFFICE') {
      // OFFICE check-out: geo-fence at office
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required to check out from office."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
      if (!isAtOffice(lat, lon)) {
        const dist = Math.round(getDistance(OFFICE_LAT, OFFICE_LONG, lat, lon));
        return res.status(403).json({
          message: `Check-out denied. You are ${dist}m away from the office. Please check out within ${OFFICE_RADIUS_METERS}m of the office.`
        });
      }

    } else if (workMode === 'WFH') {
      // WFH check-out: geo-fence at registered home address
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required to check out for WFH verification."
        });
      }
      const profile = await getEmployeeProfile(userId);
      const { home_lat, home_long } = profile;

      if (!home_lat || !home_long) {
        return res.status(403).json({
          message: "Your home location is not registered. Please contact HR."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
      if (!isAtHome(lat, lon, home_lat, home_long, WFH_RADIUS_METERS)) {
        const dist = Math.round(getDistance(home_lat, home_long, lat, lon));
        return res.status(403).json({
          message: `WFH check-out denied. You are ${dist}m from your registered home address (allowed: ${WFH_RADIUS_METERS}m).`
        });
      }
    }

    await db.query(
      `UPDATE attendance
         SET check_out = ?, checkout_latitude = ?, checkout_longitude = ?, status = 'CHECKED_OUT'
       WHERE id = ?`,
      [now, lat, lon, record.id]
    );

    const [empRows] = await db.query(
      "SELECT first_name, last_name FROM employees e JOIN users u ON e.user_id = u.id WHERE u.email = ?",
      [req.user.email]
    );
    const empName = empRows.length > 0
      ? `${empRows[0].first_name} ${empRows[0].last_name}`
      : `User ID ${userId}`;

    const modeLabel = workMode === 'WFH' ? '🏠 WFH' : '🏢 Office';
    await addActivity('ATTENDANCE', `Employee checked out (${modeLabel}): <b>${empName}</b>`, '#3b82f6');

    res.json({
      success: true,
      message: `Checked out successfully (${modeLabel})`,
      time: now,
      work_mode: workMode
    });
  } catch (err) {
    console.error("Check-out Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAttendanceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];

    const day  = todayDate.getDay();
    const diff = todayDate.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(new Date().setDate(diff)).toISOString().split('T')[0];

    const [weeklyRecords] = await db.execute(
      `SELECT check_in, check_out FROM attendance
       WHERE user_id = ? AND attendance_date >= ? AND attendance_date <= ?`,
      [userId, startOfWeek, today]
    );

    const currentServerTime = new Date().toTimeString().split(' ')[0];
    let weeklySeconds = 0;
    weeklyRecords.forEach(record => {
      const tIn  = record.check_in;
      const tOut = record.check_out || currentServerTime;
      if (tIn && tOut) {
        weeklySeconds += (new Date(`1970-01-01T${tOut}Z`) - new Date(`1970-01-01T${tIn}Z`)) / 1000;
      }
    });

    const [existing] = await db.execute(
      "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, today]
    );

    // Also fetch work_type for this employee (falls back to OFFICE if migration pending)
    const profile  = await getEmployeeProfile(userId);
    const workType = profile.work_type;

    let responseData = {
      status: 'NOT_CHECKED_IN',
      weekly_hours: (weeklySeconds / 3600).toFixed(2),
      daily_hours: '0.00',
      work_type: workType,
      work_mode: null
    };

    if (existing.length > 0) {
      responseData = { ...responseData, ...existing[0] };
      const tIn  = existing[0].check_in;
      const tOut = existing[0].check_out || currentServerTime;
      if (tIn && tOut) {
        responseData.daily_hours = ((new Date(`1970-01-01T${tOut}Z`) - new Date(`1970-01-01T${tIn}Z`)) / 3600000).toFixed(2);
      }
      responseData.work_type = workType;
    }

    res.json(responseData);
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [checkedIn] = await db.execute(
      "SELECT COUNT(*) as count FROM attendance WHERE attendance_date = ? AND status = 'CHECKED_IN'",
      [today]
    );

    const [checkedOut] = await db.execute(
      "SELECT COUNT(*) as count FROM attendance WHERE attendance_date = ? AND status = 'CHECKED_OUT'",
      [today]
    );

    res.json({
      checkedIn: checkedIn[0].count,
      checkedOut: checkedOut[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getTodayCheckedInEmployees = async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const [rows] = await db.execute(
      `SELECT 
        u.id as user_id,
        r.role_name,
        COALESCE(e.employee_code, CONCAT('ID', u.id)) as employee_code,
        COALESCE(e.first_name, u.username) as first_name,
        COALESCE(e.last_name, '') as last_name,
        a.check_in,
        a.check_out,
        COALESCE(a.status, 'NOT_CHECKED_IN') as status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN attendance a ON u.id = a.user_id AND a.attendance_date = ?
      WHERE r.role_name IN ('EMPLOYEE', 'MANAGER', 'TL', 'ADMIN', 'SUPER_ADMIN', 'HR')
      ORDER BY r.role_name ASC, employee_code ASC`,
      [targetDate]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch attendance error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT attendance_date) as working_days,
        SUM(CASE WHEN status = 'CHECKED_OUT' THEN 1 ELSE 0 END) as completions
       FROM attendance 
       WHERE attendance_date BETWEEN ? AND ?`,
      [startOfMonth, endOfMonth]
    );

    const [empCount] = await db.execute("SELECT COUNT(*) as count FROM employees");

    res.json({
      month: today.toLocaleString('default', { month: 'long' }),
      totalPresent: stats[0].total_records || 0,
      completionRate: stats[0].total_records > 0 ? Math.round((stats[0].completions / stats[0].total_records) * 100) : 0,
      staffCount: empCount[0].count,
      workingDays: stats[0].working_days || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getMonthlyAttendanceLogs = async (req, res) => {
  try {
    const { month, year, day } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    let startDate, endDate;
    if (day && day > 0) {
      startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      endDate = startDate;
    } else {
      startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;
    }

    const [rows] = await db.execute(
      `SELECT 
        u.id as user_id,
        r.role_name,
        COALESCE(e.employee_code, CONCAT('ID', u.id)) as employee_code,
        COALESCE(e.first_name, u.username) as first_name,
        COALESCE(e.last_name, '') as last_name,
        a.attendance_date,
        a.check_in,
        a.check_out,
        COALESCE(a.status, 'ABSENT') as status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN attendance a ON u.id = a.user_id AND a.attendance_date BETWEEN ? AND ?
      WHERE r.role_name IN ('EMPLOYEE', 'MANAGER', 'TL', 'ADMIN', 'HR')
      ORDER BY a.attendance_date DESC, r.role_name ASC, employee_code ASC`,
      [startDate, endDate]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch monthly logs error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAttendanceSummaryGrid = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

   
    const [employees] = await db.execute(
      `SELECT 
        u.id as user_id,
        COALESCE(e.first_name, u.username) as first_name,
        COALESCE(e.last_name, '') as last_name,
        COALESCE(e.employee_code, CONCAT('ID', u.id)) as employee_code,
        d.name as department_name,
        des.name as designation_name,
        COALESCE(e.office_location, 'Head Office') as office_location,
        COALESCE(e.user_photo, '') as photo,
        r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE r.role_name IN ('EMPLOYEE', 'MANAGER', 'TL', 'ADMIN', 'HR')`
    );

   
    const [attendance] = await db.execute(
      `SELECT user_id, attendance_date, status 
       FROM attendance 
       WHERE attendance_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

  
    const [holidays] = await db.execute(
      `SELECT holiday_date, title, holiday_type 
       FROM holidays 
       WHERE holiday_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

   
    const [leaves] = await db.execute(
      `SELECT user_id, start_date, end_date, leave_type 
       FROM leaves 
       WHERE status = 'APPROVED' AND (start_date <= ? AND end_date >= ?)`,
      [endDate, startDate]
    );

    let totalMonthPresent = 0;
    let totalMonthAbsent = 0;
    let totalMonthLeave = 0;
    let totalMonthHoliday = 0;

  
    const result = employees.map(emp => {
      const dayData = {};
      let empPresent = 0;
      let empAbsent = 0;
      let empLeave = 0;
      let empHoliday = 0;
      
      for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
     
        const holiday = holidays.find(h => {
             const hDate = new Date(h.holiday_date);
             const hStr = hDate.getFullYear() + '-' + String(hDate.getMonth()+1).padStart(2,'0') + '-' + String(hDate.getDate()).padStart(2,'0');
             return hStr === dateStr;
        });
        if (holiday) {
          dayData[String(d).padStart(2, '0')] = 'HOLIDAY';
          empHoliday++;
          totalMonthHoliday++;
          continue;
        }

        
        const leave = leaves.find(l => {
          const sDate = new Date(l.start_date);
          const eDate = new Date(l.end_date);
          const s = sDate.getFullYear() + '-' + String(sDate.getMonth()+1).padStart(2,'0') + '-' + String(sDate.getDate()).padStart(2,'0');
          const e = eDate.getFullYear() + '-' + String(eDate.getMonth()+1).padStart(2,'0') + '-' + String(eDate.getDate()).padStart(2,'0');
          return emp.user_id === l.user_id && dateStr >= s && dateStr <= e;
        });
        if (leave) {
          dayData[String(d).padStart(2, '0')] = 'LEAVE';
          empLeave++;
          totalMonthLeave++;
          continue;
        }

        
        const att = attendance.find(a => {
            const aDate = new Date(a.attendance_date);
            const aStr = aDate.getFullYear() + '-' + String(aDate.getMonth()+1).padStart(2,'0') + '-' + String(aDate.getDate()).padStart(2,'0');
            return a.user_id === emp.user_id && aStr === dateStr;
        });
        
        if (att) {
          dayData[String(d).padStart(2, '0')] = 'PRESENT';
          empPresent++;
          totalMonthPresent++;
        } else {
          const dayOfWeek = new Date(dateStr).getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayData[String(d).padStart(2, '0')] = 'WEEKEND';
          } else {
            const todayObj = new Date();
            const todayStr = todayObj.getFullYear() + '-' + String(todayObj.getMonth()+1).padStart(2,'0') + '-' + String(todayObj.getDate()).padStart(2,'0');
            if (dateStr < todayStr) {
              dayData[String(d).padStart(2, '0')] = 'ABSENT';
              empAbsent++;
              totalMonthAbsent++;
            } else {
              dayData[String(d).padStart(2, '0')] = 'PENDING';
            }
          }
        }
      }

      return {
        id: emp.user_id,
        name: `${emp.first_name} ${emp.last_name}`,
        employee_code: emp.employee_code,
        department: emp.department_name,
        designation: emp.designation_name,
        location: emp.office_location,
        photo: emp.photo,
        stats: {
          present: empPresent,
          absent: empAbsent,
          leave: empLeave,
          holiday: empHoliday
        },
        days: dayData
      };
    });

    res.json({
      daysInMonth: lastDay,
      summary: {
        totalPresent: totalMonthPresent,
        totalAbsent: totalMonthAbsent,
        totalLeave: totalMonthLeave,
        totalHoliday: totalMonthHoliday,
        staffCount: employees.length
      },
      data: result
    });

  } catch (err) {
    console.error("Attendance grid error:", err);
    res.status(500).json({ message: "Database error" });
  }
};
```

---

### `backend/controllers/authController.js`
```javascript
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT
      u.id,
      u.email,
      u.password,
      u.role_id,
      r.role_name,
      COALESCE(e.first_name, u.username, u.email) AS first_name,
      COALESCE(e.last_name, '')                    AS last_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN employees e ON u.id = e.user_id
    WHERE u.email = ?
    LIMIT 1
  `;

  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = results[0];

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const roleName = user.role_name || "EMPLOYEE";

    const token = jwt.sign(
      {
        id:      user.id,
        role:    roleName,
        role_id: user.role_id,
        email:   user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message:    "Login Successful",
      token,
      role:       roleName,
      user_id:    user.id,
      first_name: user.first_name,
      last_name:  user.last_name,
    });
  });
};

```

---

### `backend/controllers/awardController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");

exports.addAward = async (req, res) => {
  try {
    const { awardTitle, awardType, typeDescription } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
      INSERT INTO awards
      (award_title, award_type, description, file_path)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [awardTitle, awardType, typeDescription, filePath]);

    res.json({ message: "Award added successfully" });
    await addActivity('AWARD', `New award added: <b>${awardTitle}</b>`, '#f59e0b');
  } catch (error) {
    console.error("Add Award Error:", error);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAwards = async (req, res) => {
  try {
    const sql = "SELECT * FROM awards ORDER BY id DESC";
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};


exports.deleteAward = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM awards WHERE id=?";
    await db.query(sql, [id]);
    res.json({ message: "Award deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};

exports.updateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const { awardTitle, awardType, description } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    let sql;
    let params;

    if (filePath) {
      sql = `
        UPDATE awards
        SET award_title = ?, award_type = ?, description = ?, file_path = ?
        WHERE id = ?
      `;
      params = [awardTitle, awardType, description, filePath, id];
    } else {
      sql = `
        UPDATE awards
        SET award_title = ?, award_type = ?, description = ?
        WHERE id = ?
      `;
      params = [awardTitle, awardType, description, id];
    }

    await db.query(sql, params);
    res.json({ message: "Award updated successfully" });
  } catch (error) {
    console.error("Update Award Error:", error);
    res.status(500).json({ message: "Database error" });
  }
};
```

---

### `backend/controllers/complaintController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");

const COMPLAINTS_TABLE = "complaints";

const ensureComplaintsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${COMPLAINTS_TABLE} (
      id INT NOT NULL AUTO_INCREMENT,
      from_employee VARCHAR(255) NOT NULL,
      against_employee VARCHAR(255) NOT NULL,
      complaint_date DATE NOT NULL,
      category VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NULL,
      description TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT 'Normal',
      status VARCHAR(50) DEFAULT 'Pending',
      admin_remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);
};

const getComplaintColumns = async () => {
  await ensureComplaintsTable();
  const [rows] = await db.query(`SHOW COLUMNS FROM ${COMPLAINTS_TABLE}`);
  return new Set(rows.map((row) => row.Field));
};

const pickFirstExistingColumn = (columns, candidates, fallback) => {
  for (const name of candidates) {
    if (columns.has(name)) return name;
  }
  return fallback;
};

/* ================= CREATE ================= */
exports.createComplaint = async (req, res) => {

  try {
    const {
      fromEmployee,
      againstEmployee,
      complaintDate,
      category,
      subject,
      description,
      priority,
      status,
      adminRemarks,
    } = req.body;

    if (
      !fromEmployee ||
      !againstEmployee ||
      !complaintDate ||
      !category ||
      !description
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const columns = await getComplaintColumns();

    const fromColumn = pickFirstExistingColumn(
      columns,
      ["from_employee", "employee_from", "from_emp", "employee"],
      null
    );
    const againstColumn = pickFirstExistingColumn(
      columns,
      ["against_employee", "employee_against", "against_emp", "against"],
      null
    );
    const dateColumn = pickFirstExistingColumn(columns, ["complaint_date", "date"], null);
    const categoryColumn = pickFirstExistingColumn(columns, ["category", "type"], null);
    const subjectColumn = pickFirstExistingColumn(columns, ["subject", "title"], null);
    const descriptionColumn = pickFirstExistingColumn(
      columns,
      ["description", "details", "reason"],
      null
    );
    const remarksColumn = pickFirstExistingColumn(
      columns,
      ["admin_remarks", "remarks"],
      null
    );

    if (!fromColumn || !againstColumn || !dateColumn || !categoryColumn || !descriptionColumn) {
      return res.status(500).json({
        message: "Complaints table is missing required columns",
      });
    }

    const insertColumns = [fromColumn, againstColumn, dateColumn, categoryColumn, descriptionColumn];
    const insertValues = [fromEmployee, againstEmployee, complaintDate, category, description];

    if (subjectColumn) {
      insertColumns.push(subjectColumn);
      insertValues.push(subject || null);
    }

    if (columns.has("priority")) {
      insertColumns.push("priority");
      insertValues.push(priority || "Normal");
    }

    if (columns.has("status")) {
      insertColumns.push("status");
      insertValues.push(status || "Pending");
    }

    if (remarksColumn) {
      insertColumns.push(remarksColumn);
      insertValues.push(adminRemarks || null);
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    const sql = `
    INSERT INTO ${COMPLAINTS_TABLE}
    (${insertColumns.join(", ")})
    VALUES (${placeholders})
  `;

    const [result] = await db.execute(sql,
      insertValues);

    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      id: result.insertId
    });

    await addActivity('COMPLAINT', `New complaint filed by <b>${fromEmployee}</b>`, '#ef4444');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
/* ================= GET ALL ================= */
exports.getAllComplaints = async (req, res) => {
  try {
    const columns = await getComplaintColumns();
    const idColumn = pickFirstExistingColumn(columns, ["id", "complaint_id"], "id");
    const dateColumn = pickFirstExistingColumn(columns, ["complaint_date", "date"], null);
    const orderColumn = pickFirstExistingColumn(columns, ["created_at", dateColumn, idColumn], idColumn);

    const [rows] = await db.execute(
      `SELECT * FROM ${COMPLAINTS_TABLE} ORDER BY ${orderColumn} DESC, ${idColumn} DESC`
    );

    const normalizedRows = rows.map((row) => ({
      id: row.id ?? row.complaint_id ?? null,
      from_employee: row.from_employee || row.employee_from || row.from_emp || row.employee || null,
      against_employee:
        row.against_employee || row.employee_against || row.against_emp || row.against || null,
      category: row.category || row.type || null,
      subject: row.subject || row.title || null,
      description: row.description || row.details || row.reason || null,
      priority: row.priority || null,
      status: row.status || null,
      complaint_date: row.complaint_date || row.date || null,
      admin_remarks: row.admin_remarks || row.remarks || null,
    }));

    res.json(normalizedRows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ================= */
exports.updateComplaint = async (req, res) => {
  try {
    const {
      fromEmployee,
      againstEmployee,
      complaintDate,
      category,
      subject,
      description,
      priority,
      status,
      adminRemarks,
    } = req.body;
    const id = req.params.id;
    const columns = await getComplaintColumns();
    const idColumn = pickFirstExistingColumn(columns, ["id", "complaint_id"], "id");
    const fromColumn = pickFirstExistingColumn(
      columns,
      ["from_employee", "employee_from", "from_emp", "employee"],
      null
    );
    const againstColumn = pickFirstExistingColumn(
      columns,
      ["against_employee", "employee_against", "against_emp", "against"],
      null
    );
    const dateColumn = pickFirstExistingColumn(columns, ["complaint_date", "date"], null);
    const categoryColumn = pickFirstExistingColumn(columns, ["category", "type"], null);
    const subjectColumn = pickFirstExistingColumn(columns, ["subject", "title"], null);
    const descriptionColumn = pickFirstExistingColumn(
      columns,
      ["description", "details", "reason"],
      null
    );
    const remarksColumn = pickFirstExistingColumn(
      columns,
      ["admin_remarks", "remarks"],
      "admin_remarks"
    );

    const setParts = [];
    const values = [];

    if (fromColumn && fromEmployee !== undefined) {
      setParts.push(`${fromColumn} = ?`);
      values.push(fromEmployee || "");
    }

    if (againstColumn && againstEmployee !== undefined) {
      setParts.push(`${againstColumn} = ?`);
      values.push(againstEmployee || "");
    }

    if (dateColumn && complaintDate !== undefined) {
      setParts.push(`${dateColumn} = ?`);
      values.push(complaintDate || null);
    }

    if (categoryColumn && category !== undefined) {
      setParts.push(`${categoryColumn} = ?`);
      values.push(category || "");
    }

    if (subjectColumn && subject !== undefined) {
      setParts.push(`${subjectColumn} = ?`);
      values.push(subject || null);
    }

    if (descriptionColumn && description !== undefined) {
      setParts.push(`${descriptionColumn} = ?`);
      values.push(description || "");
    }

    if (columns.has("priority") && priority !== undefined) {
      setParts.push("priority = ?");
      values.push(priority || "Normal");
    }

    if (columns.has("status") && status !== undefined) {
      setParts.push("status = ?");
      values.push(status || "Pending");
    }

    if (columns.has(remarksColumn) && adminRemarks !== undefined) {
      setParts.push(`${remarksColumn} = ?`);
      values.push(adminRemarks || null);
    }

    if (!setParts.length) {
      return res.status(400).json({ message: "No updatable complaint fields found in table" });
    }

    values.push(id);

    await db.query(
      `UPDATE ${COMPLAINTS_TABLE} SET ${setParts.join(", ")} WHERE ${idColumn} = ?`,
      values
    );

    res.json({ message: "Complaint updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE ================= */
exports.deleteComplaint = async (req, res) => {
  try {
    const id = req.params.id;
    const columns = await getComplaintColumns();
    const idColumn = pickFirstExistingColumn(columns, ["id", "complaint_id"], "id");

    await db.query(`DELETE FROM ${COMPLAINTS_TABLE} WHERE ${idColumn} = ?`, [id]);
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

```

---

### `backend/controllers/departmentController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");

/* =====================================
   CREATE DEPARTMENT
===================================== */
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const sql = "INSERT INTO departments (name, code) VALUES (?, ?)";

    const [result] = await db.execute(sql, [name, code || null]);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department: {
        id: result.insertId,
        name,
        code,
      },
    });
    await addActivity('DEPARTMENT', `New department created: <b>${name}</b>`, '#6366f1');

  } catch (error) {
    console.error("Create Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};


/* =====================================
   GET ALL DEPARTMENTS
===================================== */
exports.getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.execute(
      "SELECT * FROM departments ORDER BY id DESC"
    );

    res.status(200).json({
      success: true,
      data: departments,
    });

  } catch (error) {
    console.error("Fetch Departments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};


/* =====================================
   GET SINGLE DEPARTMENT
===================================== */
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [dept] = await db.execute(
      "SELECT * FROM departments WHERE id = ?",
      [id]
    );

    if (dept.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dept[0],
    });

  } catch (error) {
    console.error("Fetch Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching department",
    });
  }
};


/* =====================================
   UPDATE DEPARTMENT
===================================== */
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const cleanName = (name || "").trim();
    const cleanCode = (code || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const [result] = await db.execute(
      "UPDATE departments SET name = ?, code = ? WHERE id = ?",
      [cleanName, cleanCode || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
    });
    await addActivity('DEPARTMENT', `Department updated: <b>${cleanName}</b>`, '#f59e0b');

  } catch (error) {
    console.error("Update Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


/* =====================================
   DELETE DEPARTMENT
===================================== */
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      "DELETE FROM departments WHERE id = ?",
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });

  } catch (error) {
    console.error("Delete Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

```

---

### `backend/controllers/designationController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");

/* =====================================
   CREATE DESIGNATION
===================================== */
exports.createDesignation = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
    }

    const [result] = await db.execute(
      "INSERT INTO designations (name, code) VALUES (?, ?)",
      [name, code || null]
    );

    res.status(201).json({
      success: true,
      message: "Designation created successfully",
      designation: {
        id: result.insertId,
        name,
        code,
      },
    });
    await addActivity('DESIGNATION', `New designation created: <b>${name}</b>`, '#8b5cf6');

  } catch (error) {
    console.error("Create Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};


/* =====================================
   GET ALL DESIGNATIONS
===================================== */
exports.getAllDesignations = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM designations ORDER BY id DESC"
    );

    res.status(200).json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error("Fetch Designations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch designations",
    });
  }
};


/* =====================================
   GET SINGLE DESIGNATION
===================================== */
exports.getDesignationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM designations WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    console.error("Fetch Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching designation",
    });
  }
};


/* =====================================
   UPDATE DESIGNATION
===================================== */
exports.updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
    }

    await db.execute(
      "UPDATE designations SET name = ?, code = ? WHERE id = ?",
      [name, code || null, id]
    );

    res.status(200).json({
      success: true,
      message: "Designation updated successfully",
    });
    await addActivity('DESIGNATION', `Designation updated: <b>${name}</b>`, '#f59e0b');

  } catch (error) {
    console.error("Update Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


/* =====================================
   DELETE DESIGNATION
===================================== */
exports.deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      "DELETE FROM designations WHERE id = ?",
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Designation deleted successfully",
    });

  } catch (error) {
    console.error("Delete Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};
```

---

### `backend/controllers/employeeController.js`
```javascript
const pool = require("../config/db");
const { addActivity } = require("./activityController");
const bcrypt = require("bcrypt");

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

const resolveRoleId = async (connection, employeeRole) => {
  const role = normalizeRole(employeeRole);

  const roleCandidates = {
    SUPER_ADMIN: ["SUPER_ADMIN"],
    ADMIN: ["ADMIN", "HR"],
    HR: ["HR", "ADMIN"],
    MANAGER: ["MANAGER"],
    TL: ["TL", "TEAM_LEAD", "TEAMLEADER"],
    TEAM_LEAD: ["TEAM_LEAD", "TL", "TEAMLEADER"],
    TEAMLEADER: ["TEAMLEADER", "TEAM_LEAD", "TL"],
    EMPLOYEE: ["EMPLOYEE"],
  };

  const candidates = roleCandidates[role] || ["EMPLOYEE"];

  for (const candidate of candidates) {
    const [rows] = await connection.query(
      `SELECT id
       FROM roles
       WHERE UPPER(REPLACE(role_name, ' ', '_')) = ?
       LIMIT 1`,
      [candidate]
    );

    if (rows.length > 0) {
      return rows[0].id;
    }
  }

  return 5;
};

exports.addEmployee = async (req, res) => {
  let connection;

  try {
    console.log("Adding employee - Request Body:", req.body);
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      gender,
      date_of_birth,
      address,
      office_location,
      aadhaar_number,
      pan_number,
      experience_years,
      joining_date,
      hire_date,
      employment_type,
      department_id,
      designation_id,
      reporting_to,
      company_type,
      onboarding_status,
      hierarchy_level,
      role_responsibility,
      employee_role,
      notice_period,
      probation_applicable,
      probation_end_date,
      previous_company,
      salary,
      bank_name,
      branch_name,
      account_number,
      ifsc_code,
      shift_id,
      status,
      work_type,
      home_lat,
      home_long
    } = req.body;

    if (!first_name || !email || !password) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const username = email;
    const role_id = await resolveRoleId(connection, employee_role);
    const resolved_shift_id = shift_id || 1;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (username,email,password,role_id,shift_id)
       VALUES (?,?,?,?,?)`,
      [username, email, hashedPassword, role_id, resolved_shift_id]
    );

    const userId = userResult.insertId;
    console.log("User created with ID:", userId);

    const [rows] = await connection.query(
      "SELECT COUNT(*) AS total FROM employees"
    );

    const next = rows[0].total + 1;
    const employee_code = "EMP" + String(next).padStart(4, "0");

    let joiningDate = hire_date || joining_date || null;
    if (joiningDate && joiningDate.trim() === "") joiningDate = null;

    let dob = date_of_birth || null;
    if (dob && dob.trim() === "") dob = null;

    const user_photo = req.files?.profile_photo?.[0]?.filename || null;
    const aadhar_photo = req.files?.aadhaar_photo?.[0]?.filename || null;
    const pan_photo = req.files?.pan_photo?.[0]?.filename || null;

    const [employeeResult] = await connection.query(
      `INSERT INTO employees (
        user_id, department_id, designation_id, employee_code, first_name, last_name, gender,
        date_of_birth, phone, address, office_location, aadhar_number, pan_number, experience_years,
        user_photo, aadhar_photo, pan_photo, joining_date, employment_type, reporting_to,
        company_type, onboarding_status, hierarchy_level, role_responsibility, notice_period_days,
        previous_company, salary, status, work_type, home_lat, home_long
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,UPPER(?),UPPER(?),?,?)`,
      [
        userId, department_id || null, designation_id || null, employee_code, first_name, last_name || null,
        gender || null, dob, phone || null, address || null, office_location || null, aadhaar_number || null,
        pan_number || null, experience_years || null, user_photo, aadhar_photo, pan_photo, joiningDate,
        employment_type || "FULL_TIME", reporting_to || null, company_type || null, onboarding_status || 'Pending',
        hierarchy_level || null, role_responsibility || null, notice_period || null, previous_company || null,
        salary || null, status || 'ACTIVE', work_type || 'OFFICE',
        home_lat ? parseFloat(home_lat) : null, home_long ? parseFloat(home_long) : null
      ]
    );

    const employeeId = employeeResult.insertId;
    console.log("Employee record created with ID:", employeeId);

    if (probation_applicable === "YES" && probation_end_date) {
      let probStartDate = joiningDate ? new Date(joiningDate) : new Date();
      await connection.query(
        `INSERT INTO employee_probation (employee_id, probation_start_date, probation_end_date, status)
         VALUES (?, ?, ?, 'IN_PROBATION')`,
        [employeeId, probStartDate, probation_end_date]
      );
    }

    if (bank_name || account_number || ifsc_code) {
      await connection.query(
        `INSERT INTO account_details (user_id, bank_name, account_number, ifsc_code, branch_name, pan_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, bank_name || "N/A", account_number || "N/A", ifsc_code || "N/A", branch_name || null, pan_number || null]
      );
    }

    await connection.query(`INSERT INTO leave_balance (user_id) VALUES (?)`, [userId]);
    await connection.commit();
    await addActivity('EMPLOYEE', `New employee onboarded: <b>${first_name} ${last_name || ''}</b>`, '#3b82f6');

    res.status(201).json({ message: "Employee Added Successfully", employee_code });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("ADD EMPLOYEE ERROR:", error);
    res.status(500).json({ error: error.sqlMessage || error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const [employees] = await pool.query(`
      SELECT e.*, d.name AS department, ds.name AS designation, s.shift_name AS shift,
      CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS name, u.email
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations ds ON e.designation_id = ds.id
      LEFT JOIN add_shifts s ON u.shift_id = s.id
      ORDER BY e.id ASC
    `);
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [employee] = await pool.query(`
      SELECT e.*, u.email, u.username, u.shift_id, ad.bank_name, ad.branch_name, ad.account_number, ad.ifsc_code,
      ep.probation_start_date, ep.probation_end_date, ep.status AS probation_status
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN account_details ad ON u.id = ad.user_id
      LEFT JOIN employee_probation ep ON e.id = ep.employee_id
      WHERE e.id = ?
    `, [id]);
    if (employee.length === 0) return res.status(404).json({ error: "Employee not found" });
    res.status(200).json(employee[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const {
      first_name, last_name, email, phone, gender, date_of_birth, address, office_location,
      aadhaar_number, pan_number, experience_years, joining_date, hire_date, employment_type,
      department_id, designation_id, reporting_to, company_type, onboarding_status,
      hierarchy_level, role_responsibility, notice_period, probation_end_date,
      previous_company, salary, bank_name, branch_name, account_number, ifsc_code,
      shift_id, status, work_type, home_lat, home_long, password
    } = req.body;

    if (!first_name || !email) return res.status(400).json({ error: "First name and email are required" });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query("SELECT id, user_id FROM employees WHERE id = ?", [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Employee not found" });
    }
    const employee = rows[0];

    // Update User
    let userUpdateSql = "UPDATE users SET email = ?, username = ?, shift_id = ? WHERE id = ?";
    let userUpdateParams = [email, email, shift_id || null, employee.user_id];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userUpdateSql = "UPDATE users SET email = ?, username = ?, shift_id = ?, password = ? WHERE id = ?";
      userUpdateParams = [email, email, shift_id || null, hashedPassword, employee.user_id];
    }
    await connection.query(userUpdateSql, userUpdateParams);

    // Update Employee
    await connection.query(
      `UPDATE employees SET
        department_id = ?, designation_id = ?, first_name = ?, last_name = ?, gender = ?,
        date_of_birth = ?, phone = ?, address = ?, office_location = ?, aadhar_number = ?,
        pan_number = ?, experience_years = ?, joining_date = ?, employment_type = ?,
        reporting_to = ?, company_type = ?, onboarding_status = ?, hierarchy_level = ?,
        role_responsibility = ?, notice_period_days = ?, previous_company = ?, salary = ?,
        status = UPPER(?), work_type = UPPER(?), home_lat = ?, home_long = ?
      WHERE id = ?`,
      [
        department_id || null, designation_id || null, first_name, last_name || null, gender || null,
        date_of_birth || null, phone || null, address || null, office_location || null, aadhaar_number || null,
        pan_number || null, experience_years || null, hire_date || joining_date || null, employment_type || null,
        reporting_to || null, company_type || null, onboarding_status || 'Pending', hierarchy_level || null,
        role_responsibility || null, notice_period || null, previous_company || null, salary || null,
        status || 'ACTIVE', work_type || 'OFFICE', 
        home_lat ? parseFloat(home_lat) : null, home_long ? parseFloat(home_long) : null, id
      ]
    );

    // Update Bank Details
    await connection.query(
      `INSERT INTO account_details (user_id, bank_name, account_number, ifsc_code, branch_name)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE bank_name = VALUES(bank_name), account_number = VALUES(account_number), 
       ifsc_code = VALUES(ifsc_code), branch_name = VALUES(branch_name)`,
      [employee.user_id, bank_name || "N/A", account_number || "N/A", ifsc_code || "N/A", branch_name || null]
    );

    await connection.commit();
    await addActivity('EMPLOYEE', `Employee profile updated: <b>${first_name} ${last_name || ''}</b>`, '#f59e0b');
    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.sqlMessage || error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.sqlMessage || error.message });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const uppercaseStatus = status.toUpperCase();
    const [result] = await pool.query(
      "UPDATE employees SET status = UPPER(?), status_reason = ? WHERE id = ?",
      [uppercaseStatus, reason || null, id]
    );
    await addActivity('EMPLOYEE', `Employee status changed to <b>${uppercaseStatus}</b> for ID: ${id}`, '#ef4444');
    if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.sqlMessage || error.message });
  }
};

```

---

### `backend/controllers/holidayController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");


// ADD HOLIDAY
exports.addHoliday = async (req, res) => {
  try {

    console.log("REQUEST BODY:", req.body);
    let { title, holiday_date, description, holiday_type } = req.body;

    if (!title || !holiday_date) {
      return res.status(400).json({
        message: "Title and Date required"
      });
    }

    // convert to DB format
    if (holiday_type === "Full Day") holiday_type = "FULL_DAY";
    if (holiday_type === "Half Day") holiday_type = "HALF_DAY";

    const sql = `
      INSERT INTO holidays
      (title, holiday_date, description, holiday_type)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [
      title,
      holiday_date,
      description || null,
      holiday_type || "FULL_DAY"
    ]);

    await addActivity('HOLIDAY', `New holiday added: <b>${title}</b>`, '#ec4899');

    res.status(201).json({
      message: "Holiday added successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// GET HOLIDAYS
exports.getHolidays = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
        id,
        title,
        holiday_date,
        holiday_type,
        description,
        created_at,
        updated_at
      FROM holidays
      ORDER BY holiday_date ASC
    `);

    res.json(rows);

  } catch (error) {

    console.error("GET HOLIDAYS ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });

  }
};


// UPDATE HOLIDAY
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, holiday_date, description, holiday_type } = req.body;

    if (holiday_type === "Full Day") holiday_type = "FULL_DAY";
    if (holiday_type === "Half Day") holiday_type = "HALF_DAY";

    await db.query(
      "UPDATE holidays SET title = ?, holiday_date = ?, description = ?, holiday_type = ? WHERE id = ?",
      [title, holiday_date, description || null, holiday_type || "FULL_DAY", id]
    );

    await addActivity('HOLIDAY', `Holiday updated: <b>${title}</b>`, '#f59e0b');

    res.json({ message: "Holiday updated successfully" });
  } catch (error) {
    console.error("UPDATE HOLIDAY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET HOLIDAY BY ID
exports.getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM holidays WHERE id = ?", [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("GET HOLIDAY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE HOLIDAY
exports.deleteHoliday = async (req, res) => {
  try {

    const { id } = req.params;

    await db.query(
      "DELETE FROM holidays WHERE id = ?",
      [id]
    );

    res.json({
      message: "Holiday deleted"
    });

  } catch (error) {

    console.error("DELETE HOLIDAY ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });

  }
};
```

---

### `backend/controllers/leaveTypeController.js`
```javascript
const db = require("../config/db");


exports.addLeaveType = async (req, res) => {
  try {
    const { leaveName, leaveType, description, maxDays, status } = req.body;

    if (!leaveName || !leaveType || !maxDays) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }


    const [existing] = await db.execute(
      "SELECT id FROM leave_types WHERE leave_name = ?",
      [leaveName.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Leave Type already exists",
      });
    }

    const sql = `
      INSERT INTO leave_types
      (leave_name, leave_type, description, max_days, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      leaveName.trim(),
      leaveType,
      description || null,
      parseInt(maxDays),
      status || "Active",
    ]);

    res.status(201).json({
      message: "Leave Type Added Successfully",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Add Leave Type Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};




exports.getLeaveTypes = async (req, res) => {
  try {

    const [rows] = await db.execute(`
      SELECT 
        id,
        leave_name AS name,
        leave_type AS type,
        max_days AS maxDays,
        status
      FROM leave_types
      ORDER BY id DESC
    `);

    res.status(200).json(rows);

  } catch (error) {
    console.error("Get Leave Types Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};




exports.getLeaveTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`
      SELECT 
        id,
        leave_name AS name,
        leave_type AS type,
        description,
        max_days AS maxDays,
        status
      FROM leave_types
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Leave Type not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Get Leave Type By Id Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.deleteLeaveType = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.execute(
      "SELECT id FROM leave_types WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Leave Type not found",
      });
    }

    await db.execute(
      "DELETE FROM leave_types WHERE id = ?",
      [id]
    );

    res.status(200).json({
      message: "Leave Type deleted successfully",
    });

  } catch (error) {
    console.error("Delete Leave Type Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.updateLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveName, leaveType, description, maxDays, status } = req.body;

    if (!leaveName || !leaveType || !maxDays) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    const [existing] = await db.execute(
      "SELECT id FROM leave_types WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Leave Type not found",
      });
    }

    const sql = `
      UPDATE leave_types 
      SET leave_name = ?, leave_type = ?, description = ?, max_days = ?, status = ?
      WHERE id = ?
    `;

    await db.execute(sql, [
      leaveName.trim(),
      leaveType,
      description || null,
      parseInt(maxDays),
      status || "Active",
      id,
    ]);

    res.status(200).json({
      message: "Leave Type updated successfully",
    });

  } catch (error) {
    console.error("Update Leave Type Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
```

---

### `backend/controllers/notificationController.js`
```javascript
const pool = require("../config/db");

// Internal utility function to trigger a notification from other controllers
exports.createNotification = async (userId, title, message) => {
  try {
    const query = `
      INSERT INTO notifications (user_id, title, message, is_read)
      VALUES (?, ?, ?, 0)
    `;
    await pool.query(query, [userId, title, message]);
    return true;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return false;
  }
};

// GET /api/notifications/:userId
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const query = `
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    
    const [notifications] = await pool.query(query, [userId]);
    res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `UPDATE notifications SET is_read = 1 WHERE id = ?`;
    await pool.query(query, [id]);
    
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// PUT /api/notifications/read-all/:userId
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `UPDATE notifications SET is_read = 1 WHERE user_id = ?`;
    await pool.query(query, [userId]);
    
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
};

```

---

### `backend/controllers/payrollController.js`
```javascript
const pool = require("../config/db");

// Get all payrolls
exports.getAllPayrolls = async (req, res) => {
  try {
    const query = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, u.email 
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY p.year DESC, p.month DESC, p.id DESC
    `;
    const [payrolls] = await pool.query(query);
    res.status(200).json(payrolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payrolls" });
  }
};

// Get payrolls by user ID
exports.getEmployeePayrolls = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, e.joining_date, d.name AS designation, dept.name as department
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN departments dept ON e.department_id = dept.id
      WHERE u.id = ?
      ORDER BY p.year DESC, p.month DESC
    `;
    const [payrolls] = await pool.query(query, [userId]);
    res.status(200).json(payrolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee payrolls" });
  }
};

// Generate Payroll
exports.generatePayroll = async (req, res) => {
  try {
    const {
      employee_id,
      month,
      year,
      basic_salary,
      hra,
      allowances,
      pf_deduction,
      tax_deduction,
      net_salary,
      payment_date,
    } = req.body;

    if (!employee_id || !month || !year || !net_salary) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    const query = `
      INSERT INTO payroll 
      (employee_id, month, year, basic_salary, hra, allowances, pf_deduction, tax_deduction, net_salary, payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GENERATED')
    `;

    const values = [
      employee_id, month, year, 
      basic_salary || 0, hra || 0, allowances || 0, 
      pf_deduction || 0, tax_deduction || 0, net_salary, 
      payment_date || new Date().toISOString().split('T')[0]
    ];

    await pool.query(query, values);
    
    try {
      const [empRes] = await pool.query("SELECT user_id FROM employees WHERE id = ?", [employee_id]);
      if (empRes.length > 0) {
        const { createNotification } = require("./notificationController");
        await createNotification(empRes[0].user_id, "Payroll Generated", `Your payslip for ${month} ${year} has been generated.`);
      }
    } catch (notifErr) {
      console.error("Non-fatal notification error:", notifErr);
    }
    
    res.status(201).json({ message: "Payroll Generated Successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Payroll for this month and year already exists for this employee." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to generate payroll" });
  }
};

// Update Payroll Status
exports.updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE payroll SET status = ? WHERE id = ?", [status, id]);
    res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
};

```

---

### `backend/controllers/performanceController.js`
```javascript
const pool = require("../config/db");

// Get all performance reviews
exports.getAllReviews = async (req, res) => {
  try {
    const query = `
      SELECT pr.*, e.first_name AS employee_first_name, e.last_name AS employee_last_name, 
             e.employee_code, u.username AS reviewer_name, d.name AS department, r.role_name AS reviewer_role
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON pr.reviewer_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY pr.review_date DESC, pr.id DESC
    `;
    const [reviews] = await pool.query(query);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch performance reviews" });
  }
};

// Get performance reviews for a specific employee (based on their user ID)
exports.getEmployeeReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT pr.*, u.username AS reviewer_name, r.role_name AS reviewer_role
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON pr.reviewer_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE e.user_id = ?
      ORDER BY pr.review_date DESC
    `;
    const [reviews] = await pool.query(query, [userId]);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee performance reviews" });
  }
};

// Submit a new performance review
exports.submitReview = async (req, res) => {
  try {
    const { employee_id, reviewer_id, review_date, rating, feedback } = req.body;

    if (!employee_id || !reviewer_id || !review_date || !rating) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const query = `
      INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, rating, feedback, status)
      VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
    `;

    const values = [employee_id, reviewer_id, review_date, rating, feedback || ""];
    
    await pool.query(query, values);
    
    try {
      const [empRes] = await pool.query("SELECT user_id FROM employees WHERE id = ?", [employee_id]);
      if (empRes.length > 0) {
        const { createNotification } = require("./notificationController");
        await createNotification(empRes[0].user_id, "New Performance Review", "A new performance review has been submitted for you.");
      }
    } catch (notifErr) {
      console.error("Non-fatal notification error:", notifErr);
    }
    
    res.status(201).json({ message: "Performance Review Submitted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit performance review" });
  }
};

```

---

### `backend/controllers/policyController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");

const formatPolicy = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  applicable_to: row.applicable_to,
  start_date: row.start_date,
  end_date: row.end_date,
  created_by_name: row.created_by_name,
  status: row.status,
  file_url: row.file_url,
  uploaded_by: row.uploaded_by,
  created_at: row.created_at
});

/* =====================================================
   ADD POLICY
===================================================== */
exports.addPolicy = async (req, res) => {
  try {
    const {
      title,
      description,
      applicableTo,
      startDate,
      endDate,
      createdBy,
      status
    } = req.body;

    if (!title || !description || !applicableTo || !startDate || !createdBy || !status) {
      return res.status(400).json({
        message: "All required fields must be filled"
      });
    }

    const fileUrl = req.file ? `/uploads/policies/${req.file.filename}` : null;

    const sql = `
      INSERT INTO company_policies
      (title, description, applicable_to, start_date, end_date, created_by_name, status, file_url, uploaded_by)
      VALUES (?,?,?,?,?,?,?,?,?)
    `;

    const [result] = await db.execute(sql, [
      title,
      description,
      applicableTo,
      startDate,
      endDate || null,
      createdBy,
      status,
      fileUrl,
      req.user?.id || createdBy || null
    ]);

    res.status(201).json({
      message: "Policy added successfully",
      policy: {
        id: result.insertId,
        title,
        description,
        applicable_to: applicableTo,
        start_date: startDate,
        end_date: endDate || null,
        created_by_name: createdBy,
        status,
        file_url: fileUrl
      }
    });
    await addActivity('POLICY', `New policy published: <b>${title}</b>`, '#06b6d4');
  } catch (err) {
    console.error("Add Policy Error:", err);
    return res.status(500).json({
      message: "Server error while adding policy"
    });
  }
};

/* =====================================================
   GET ALL POLICIES
===================================================== */
exports.getAllPolicies = async (req, res) => {
  try {
    const sql = "SELECT * FROM company_policies ORDER BY id DESC";
    const [rows] = await db.query(sql);

    res.status(200).json(rows.map(formatPolicy));
  } catch (err) {
    console.error("Fetch Policies Error:", err);
    return res.status(500).json({
      message: "Server error while fetching policies"
    });
  }
};

/* =====================================================
   GET SINGLE POLICY
===================================================== */
exports.getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM company_policies WHERE id = ?";
    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json(formatPolicy(rows[0]));
  } catch (err) {
    console.error("Fetch Policy Error:", err);
    return res.status(500).json({
      message: "Server error while fetching policy"
    });
  }
};

/* =====================================================
   UPDATE POLICY
===================================================== */
exports.updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, applicableTo, startDate, endDate, status } = req.body;

    if (!title || !description || !applicableTo || !startDate || !status) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const fileUrl = req.file ? `/uploads/policies/${req.file.filename}` : null;

    let sql = `
      UPDATE company_policies
      SET title = ?, description = ?, applicable_to = ?, start_date = ?, status = ?
    `;

    const params = [title, description, applicableTo, startDate, status];

    if (endDate) {
      sql += ", end_date = ?";
      params.push(endDate);
    } else {
      sql += ", end_date = NULL";
    }

    if (fileUrl) {
      sql += ", file_url = ?";
      params.push(fileUrl);
    }

    sql += " WHERE id = ?";
    params.push(id);

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json({
      message: "Policy updated successfully",
      policy: {
        id: Number(id),
        title,
        description,
        applicable_to: applicableTo,
        start_date: startDate,
        end_date: endDate || null,
        status,
        file_url: fileUrl || undefined
      }
    });
    await addActivity('POLICY', `Policy updated: <b>${title}</b>`, '#f59e0b');
  } catch (err) {
    console.error("Update Policy Error:", err);
    return res.status(500).json({ message: "Server error while updating policy" });
  }
};

/* =========================================
   DELETE POLICY
========================================= */
exports.deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      "DELETE FROM company_policies WHERE id = ?",
      [id]
    );

    res.json({ message: "Policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

```

---

### `backend/controllers/shiftController.js`
```javascript
const db = require("../config/db");

/* ================= ADD SHIFT ================= */

exports.addShift = async (req, res) => {
    try {
        const {
            shiftName,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter,
            workModeId
        } = req.body;

        const sql = `
            INSERT INTO add_shifts 
            (shift_name, work_mode_id, clock_in, clock_out, early_clock_in, allow_clock_out, late_mark_after)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [
            shiftName,
            workModeId || null,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter
        ]);

        res.json({ message: "Shift added successfully" });
    } catch (err) {
        console.error("Add Shift Error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};


/* ================= GET SHIFTS ================= */

exports.getShifts = async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.id,
                s.shift_name,
                s.clock_in,
                s.clock_out,
                s.early_clock_in,
                s.allow_clock_out,
                s.late_mark_after,
                s.work_mode_id,
                wm.mode_name AS work_mode
            FROM add_shifts s
            LEFT JOIN work_modes wm 
            ON s.work_mode_id = wm.id
            ORDER BY s.id ASC;
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        console.error("Get Shifts Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/* ================= GET SHIFT BY ID ================= */

exports.getShiftById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                s.id,
                s.shift_name,
                s.clock_in,
                s.clock_out,
                s.early_clock_in,
                s.allow_clock_out,
                s.late_mark_after,
                s.work_mode_id,
                wm.mode_name AS work_mode
            FROM add_shifts s
            LEFT JOIN work_modes wm 
            ON s.work_mode_id = wm.id
            WHERE s.id = ?
        `;
        const [results] = await db.query(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ message: "Shift not found" });
        }
        res.json(results[0]);
    } catch (err) {
        console.error("Get Shift By ID Error:", err);
        res.status(500).json({ message: err.message });
    }
};


/* ================= UPDATE SHIFT ================= */

exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            shiftName,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter,
            workModeId
        } = req.body;

        const sql = `
            UPDATE add_shifts SET
            shift_name = ?,
            work_mode_id = ?,
            clock_in = ?,
            clock_out = ?,
            early_clock_in = ?,
            allow_clock_out = ?,
            late_mark_after = ?
            WHERE id = ?
        `;

        await db.query(sql, [
            shiftName,
            workModeId || null,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter,
            id
        ]);

        res.json({ message: "Shift updated successfully" });
    } catch (err) {
        console.error("Update Shift Error:", err);
        res.status(500).json({ message: err.message });
    }
};


/* ================= DELETE SHIFT ================= */

exports.deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "DELETE FROM add_shifts WHERE id = ?";
        await db.query(sql, [id]);
        res.json({ message: "Shift deleted successfully" });
    } catch (err) {
        console.error("Delete Shift Error:", err);
        res.status(500).json({ message: err.message });
    }
};
```

---

### `backend/controllers/terminationController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");
const TERMINATION_TABLE = "employee_terminations";

const ensureTerminationTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TERMINATION_TABLE} (
      id INT NOT NULL AUTO_INCREMENT,
      employee_id INT NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      department VARCHAR(255) NULL,
      designation VARCHAR(255) NULL,
      notice_date DATE NOT NULL,
      notice_period INT NULL,
      last_working_day DATE NULL,
      termination_type VARCHAR(255) NOT NULL,
      reason TEXT NOT NULL,
      remarks TEXT NULL,
      rehire_eligible VARCHAR(50) NULL,
      status VARCHAR(50) DEFAULT 'Terminated',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);
};

const getTerminationColumns = async () => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${TERMINATION_TABLE}`);
  return new Set(rows.map((row) => row.Field));
};

const pickColumn = (columns, aliases) => aliases.find((name) => columns.has(name));

/* =======================================================
   ADD TERMINATION CONTROLLER
======================================================= */

const addTermination = async (req, res) => {
  try {
    await ensureTerminationTable();

    const {
      employeeId,
      employeeName,
      department,
      designation,
      noticeDate,
      noticePeriod,
      lastWorkingDay,
      terminationType,
      reason,
      remarks,
      rehireEligible,
      status,
    } = req.body;

    // Required validation
    if (!employeeId || !noticeDate || !terminationType || !reason) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const columns = await getTerminationColumns();
    const fieldMap = [
      { aliases: ["employee_id", "employee"], value: employeeId },
      { aliases: ["employee_name", "name"], value: employeeName || "N/A" },
      { aliases: ["department"], value: department || null },
      { aliases: ["designation"], value: designation || null },
      { aliases: ["notice_date", "date"], value: noticeDate },
      {
        aliases: ["notice_period", "notice_days"],
        value: noticePeriod === "" || noticePeriod == null ? null : Number(noticePeriod),
      },
      { aliases: ["last_working_day"], value: lastWorkingDay || null },
      { aliases: ["termination_type", "type", "title"], value: terminationType },
      { aliases: ["reason", "description"], value: reason },
      { aliases: ["remarks", "comment"], value: remarks || null },
      { aliases: ["rehire_eligible", "rehire"], value: rehireEligible || null },
      { aliases: ["status"], value: status || "Terminated" },
    ];

    const insertColumns = [];
    const insertValues = [];

    for (const field of fieldMap) {
      const column = pickColumn(columns, field.aliases);
      if (!column) continue;
      insertColumns.push(column);
      insertValues.push(field.value);
    }

    if (!insertColumns.length) {
      throw new Error("No compatible columns found in employee_terminations table");
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    const sql = `
      INSERT INTO ${TERMINATION_TABLE} (${insertColumns.join(", ")})
      VALUES (${placeholders})
    `;

    await db.query(sql, insertValues);

    res.status(201).json({
      success: true,
      message: "Employee terminated successfully",
    });

    await addActivity('TERMINATION', `Employee terminated: <b>${employeeName}</b>`, '#ef4444');

  } catch (error) {
    console.log("Termination Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getTerminations = async (req, res) => {
  try {
    await ensureTerminationTable();
    const columns = await getTerminationColumns();

    const idColumn = pickColumn(columns, ["id", "termination_id"]) || "id";
    const orderColumn =
      pickColumn(columns, ["created_at", "notice_date", "date", idColumn]) || idColumn;

    const [rows] = await db.query(
      `SELECT * FROM ${TERMINATION_TABLE} ORDER BY ${orderColumn} DESC, ${idColumn} DESC`
    );

    const normalizedRows = rows.map((row) => ({
      id: row.id ?? row.termination_id ?? null,
      employeeId: row.employee_id ?? row.employee ?? null,
      employeeName: row.employee_name ?? row.name ?? null,
      department: row.department ?? null,
      designation: row.designation ?? null,
      noticeDate: row.notice_date ?? row.date ?? null,
      noticePeriod: row.notice_period ?? row.notice_days ?? null,
      lastWorkingDay: row.last_working_day ?? null,
      terminationType: row.termination_type ?? row.type ?? row.title ?? null,
      reason: row.reason ?? row.description ?? null,
      remarks: row.remarks ?? row.comment ?? null,
      rehireEligible: row.rehire_eligible ?? row.rehire ?? null,
      status: row.status ?? "Terminated",
    }));

    res.json(normalizedRows);
  } catch (error) {
    console.log("Get Terminations Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateTermination = async (req, res) => {
  try {
    await ensureTerminationTable();

    const id = req.params.id;
    const {
      employeeId,
      employeeName,
      department,
      designation,
      noticeDate,
      noticePeriod,
      lastWorkingDay,
      terminationType,
      reason,
      remarks,
      rehireEligible,
      status,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Termination ID is required" });
    }

    const columns = await getTerminationColumns();
    const idColumn = pickColumn(columns, ["id", "termination_id"]) || "id";

    const fieldMap = [
      { aliases: ["employee_id", "employee"], value: employeeId },
      { aliases: ["employee_name", "name"], value: employeeName },
      { aliases: ["department"], value: department },
      { aliases: ["designation"], value: designation },
      { aliases: ["notice_date", "date"], value: noticeDate },
      {
        aliases: ["notice_period", "notice_days"],
        value: noticePeriod === "" || noticePeriod == null ? null : Number(noticePeriod),
      },
      { aliases: ["last_working_day"], value: lastWorkingDay || null },
      { aliases: ["termination_type", "type", "title"], value: terminationType },
      { aliases: ["reason", "description"], value: reason },
      { aliases: ["remarks", "comment"], value: remarks || null },
      { aliases: ["rehire_eligible", "rehire"], value: rehireEligible || null },
      { aliases: ["status"], value: status || "Terminated" },
    ];

    const setParts = [];
    const values = [];

    for (const field of fieldMap) {
      if (field.value === undefined) continue;
      const column = pickColumn(columns, field.aliases);
      if (!column) continue;
      setParts.push(`${column} = ?`);
      values.push(field.value);
    }

    if (!setParts.length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    values.push(id);

    const sql = `
      UPDATE ${TERMINATION_TABLE}
      SET ${setParts.join(", ")}
      WHERE ${idColumn} = ?
    `;

    const [result] = await db.query(sql, values);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Termination not found" });
    }

    return res.json({ success: true, message: "Termination updated successfully" });
  } catch (error) {
    console.log("Update Termination Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteTermination = async (req, res) => {
  try {
    await ensureTerminationTable();

    const id = req.params.id;
    const columns = await getTerminationColumns();
    const idColumn = pickColumn(columns, ["id", "termination_id"]) || "id";

    const [result] = await db.query(
      `DELETE FROM ${TERMINATION_TABLE} WHERE ${idColumn} = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Termination not found" });
    }

    return res.json({ success: true, message: "Termination deleted successfully" });
  } catch (error) {
    console.log("Delete Termination Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addTermination, getTerminations, updateTermination, deleteTermination };

```

---

### `backend/controllers/userController.js`
```javascript
exports.getDashboard = (req, res) => {
  res.json({
    message: "Welcome to HRMS Dashboard",
    userId: req.user.id,
  });
};
```

---

### `backend/controllers/warningController.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("./activityController");

exports.createWarning = (req, res) => {
  const { employee, title, category, date, description } = req.body;

  const evidenceFile = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO employee_warnings
    (employee, title, category, warning_date, description, evidence_file, issued_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      employee,
      title,
      category,
      date,
      description,
      evidenceFile,
      req.user.id,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.status(201).json({
        message: "Warning issued successfully",
      });

      addActivity('WARNING', `New warning issued to <b>${employee}</b>: ${title}`, '#ef4444');
    }
  );
};
```

---

## Routes

### `backend/routes/activityRoutes.js`
```javascript
const db = require("../config/db");
const { addActivity } = require("../controllers/activityController");

const router = require("express").Router();

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM recent_activities ORDER BY created_at DESC LIMIT 50");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

```

---

### `backend/routes/appreciationRoutes.js`
```javascript
const express = require("express");
const router = express.Router();

const {
  addAppreciation,
  deleteAppreciation,
  getAppreciations,
  updateAppreciation,
  getAppreciationById
} = require("../controllers/appreciationController");

const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

/* ADD */
router.post(
  "/add",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  addAppreciation
);

/* GET ALL */
router.get(
  "/",
  verifyToken,
  getAppreciations
);

/* GET BY ID */
router.get(
  "/:id",
  verifyToken,
  getAppreciationById
);

/* DELETE */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteAppreciation
);

/* UPDATE */
router.put(
  "/update/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateAppreciation
);

module.exports = router;
```

---

### `backend/routes/assetRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadAsset");
const { addAsset, getAssets, updateAsset, deleteAsset, getAssetById } = require("../controllers/assetController");
const { allocateAsset } = require("../controllers/assetAllocationController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/",
  upload.single("assetImage"),
  addAsset
);

router.post(
  "/allocate",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  allocateAsset
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getAssets
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getAssetById
);

router.put(
  "/update/:id",
  upload.single("assetImage"),
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateAsset
);

router.delete(
  "/delete/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteAsset
);

module.exports = router;
```

---

### `backend/routes/attendanceRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/manual",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  attendanceController.addManualAttendance
);

router.post("/check-in", verifyToken, attendanceController.checkIn);
router.post("/check-out", verifyToken, attendanceController.checkOut);
router.get("/status", verifyToken, attendanceController.getAttendanceStatus);
router.get("/summary", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN"), attendanceController.getAttendanceSummary);
router.get("/today", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), attendanceController.getTodayCheckedInEmployees);
router.get("/monthly-summary", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN"), attendanceController.getMonthlySummary);
router.get("/monthly-logs", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN"), attendanceController.getMonthlyAttendanceLogs);
router.get("/grid", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), attendanceController.getAttendanceSummaryGrid);

module.exports = router;
```

---

### `backend/routes/authRoutes.js`
```javascript
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

/* =====================================================
   REGISTER USER (SUPER ADMIN CAN CREATE EMPLOYEES)
   ===================================================== */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role_id, shift_id } = req.body;

    // Validation
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ message: "All required fields missing" });
    }

    // Email already exists?
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert
    await db.execute(
      `INSERT INTO users (username, email, password, role_id, shift_id)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role_id, shift_id || null]
    );

    res.status(201).json({
      message: "User created successfully"
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});


/* =====================================================
   LOGIN USER
   ===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    /* ---------- GET USER FIRST (NO ROLE JOIN BLOCK) ---------- */
    const [users] = await db.execute(
      `SELECT id, username, email, password, role_id
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = users[0];

    /* ---------- PASSWORD CHECK ---------- */
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid password" });

    /* ---------- NOW FETCH ROLE ---------- */
    const [roleData] = await db.execute(
      "SELECT role_name FROM roles WHERE id = ?",
      [user.role_id]
    );

    let roleName = "EMPLOYEE"; // fallback safety
    if (roleData.length > 0) {
      roleName = roleData[0].role_name;
    }

    /* ---------- JWT ---------- */
    const token = jwt.sign(
      {
        id: user.id,
        role: roleName,
        role_id: user.role_id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: roleName,
      user_id: user.id
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login error" });
  }
});
module.exports = router; 
```

---

### `backend/routes/awardRoutes.js`
```javascript
const express = require("express");
const router = express.Router();

const {
  addAward,
  getAwards,
  deleteAward,
  updateAward
} = require("../controllers/awardController");

const upload = require("../middleware/uploadAward");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");


/* ================= GET ================= */

router.get(
  "/",
  verifyToken,
  getAwards
);


/* ================= ADD ================= */

router.post(
  "/add",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  upload.single("typeFile"),
  addAward
);


/* ================= DELETE ================= */

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteAward
);

router.put(
  "/update/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  upload.single("typeFile"),
  updateAward
);                  

module.exports = router;
```

---

### `backend/routes/complaintRoutes.js`
```javascript
const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/complaintmiddleware");
const complaintController = require("../controllers/complaintController");

router.post("/add", verifyToken, complaintController.createComplaint);
router.get("/", verifyToken, complaintController.getAllComplaints);
router.put("/:id", verifyToken, complaintController.updateComplaint);
router.delete("/:id", verifyToken, complaintController.deleteComplaint);

module.exports = router;
```

---

### `backend/routes/departmentRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");


router.post("/create", departmentController.createDepartment);


// READ ALL
router.get("/", departmentController.getAllDepartments);

// READ SINGLE
router.get("/:id", departmentController.getDepartmentById);

// UPDATE
router.put("/:id", departmentController.updateDepartment);
router.put("/update/:id", departmentController.updateDepartment);

// DELETE
router.delete("/:id", departmentController.deleteDepartment);


module.exports = router;

```

---

### `backend/routes/designationRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const designationController = require("../controllers/designationController");

// CREATE
router.post("/", designationController.createDesignation);

// READ ALL
router.get("/", designationController.getAllDesignations);

// READ SINGLE
router.get("/:id", designationController.getDesignationById);

// UPDATE
router.put("/:id", designationController.updateDesignation);

// DELETE
router.delete("/:id", designationController.deleteDesignation);

module.exports = router;
```

---

### `backend/routes/employeeRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  addEmployee,
  getAllEmployees,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  getEmployeeById
} = require("../controllers/employeeController");

/* names MUST match React form */
router.post(
  "/add",
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "aadhaar_photo", maxCount: 1 },
    { name: "pan_photo", maxCount: 1 },
  ]),
  addEmployee
);

router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.put("/:id/status", updateEmployeeStatus);
router.delete("/:id", deleteEmployee);

module.exports = router;

```

---

### `backend/routes/holidayRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const {
  addHoliday,
  getHolidays,
  deleteHoliday,
  getHolidayById,
  updateHoliday
} = require("../controllers/holidayController");


router.post("/", addHoliday);

router.get("/", getHolidays);


router.delete("/:id", deleteHoliday);
router.get("/:id", getHolidayById);
router.put("/:id", updateHoliday);

module.exports = router;
```

---

### `backend/routes/leaveTypeRoutes.js`
```javascript
const express = require("express");
const router = express.Router();

const {
  addLeaveType,
  getLeaveTypes,
  deleteLeaveType,
  updateLeaveType,
  getLeaveTypeById,
} = require("../controllers/leaveTypeController");

const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// GET ALL
router.get(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  getLeaveTypes
);

// GET BY ID
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  getLeaveTypeById
);

// ADD
router.post(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  addLeaveType
);

// UPDATE
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  updateLeaveType
);

// DELETE
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  deleteLeaveType
);

module.exports = router;
```

---

### `backend/routes/notificationRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/:userId", notificationController.getNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all/:userId", notificationController.markAllAsRead);

module.exports = router;

```

---

### `backend/routes/payrollRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");

router.post("/generate", payrollController.generatePayroll);
router.get("/", payrollController.getAllPayrolls);
router.get("/employee/:userId", payrollController.getEmployeePayrolls);
router.put("/:id/status", payrollController.updatePayrollStatus);

module.exports = router;

```

---

### `backend/routes/performanceRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const performanceController = require("../controllers/performanceController");

router.post("/submit", performanceController.submitReview);
router.get("/", performanceController.getAllReviews);
router.get("/employee/:userId", performanceController.getEmployeeReviews);

module.exports = router;

```

---

### `backend/routes/policyRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");
const upload = require("../middleware/uploadPolicy");


router.post("/", upload.single("policyDocument"), policyController.addPolicy);
router.post("/create", upload.single("policyDocument"), policyController.addPolicy);


// READ ALL
router.get("/", policyController.getAllPolicies);

// READ SINGLE
router.get("/:id", policyController.getPolicyById);

// UPDATE
router.put("/:id", upload.single("policyDocument"), policyController.updatePolicy);

// DELETE
router.delete("/:id", policyController.deletePolicy);


module.exports = router;

```

---

### `backend/routes/shiftRoutes.js`
```javascript
const express = require("express");
const router = express.Router();

const {
  addShift,
  getShifts,
  updateShift,
  deleteShift,
  getShiftById
} = require("../controllers/shiftController");

const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");


/* ADD SHIFT */

router.post(
  "/add",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  addShift
);

/* GET ALL WORK MODES */
router.get("/work-modes", async (req, res) => {
  try {
    const db = require("../config/db");
    const [results] = await db.query("SELECT * FROM work_modes ORDER BY id ASC");
    res.json(results);
  } catch (err) {
    console.error("Get Work Modes Error:", err);
    res.status(500).json({ message: err.message });
  }
});


/* GET ALL SHIFTS */

router.get(
  "/",
  verifyToken,
  getShifts
);

/* GET SHIFT BY ID */
router.get(
  "/:id",
  verifyToken,
  getShiftById
);


/* UPDATE SHIFT */

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateShift
);


/* DELETE SHIFT */

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteShift
);

module.exports = router;
```

---

### `backend/routes/terminationRoutes.js`
```javascript
const express = require("express");
const router = express.Router();

const {
  addTermination,
  getTerminations,
  updateTermination,
  deleteTermination,
} = require("../controllers/terminationController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getTerminations);
router.post("/", verifyToken, addTermination);
router.put("/:id", verifyToken, updateTermination);
router.delete("/:id", verifyToken, deleteTermination);

module.exports = router;

```

---

### `backend/routes/userRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Example Protected Routes

router.get(
  "/superadmin",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => {
    res.json({ message: "Welcome Super Admin" });
  }
);

router.get(
  "/admin",
  verifyToken,
  authorizeRoles("HR"),
  (req, res) => {
    res.json({ message: "Welcome HR Admin" });
  }
);

router.get(
  "/manager",
  verifyToken,
  authorizeRoles("MANAGER"),
  (req, res) => {
    res.json({ message: "Welcome Manager" });
  }
);

module.exports = router;

```

---

### `backend/routes/warningRoutes.js`
```javascript
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadWarning");
const { verifyToken } = require("../middleware/authMiddleware");
const db = require("../config/db");
const WARNING_TABLE = "employee_warnings";

const ensureWarningsTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS ${WARNING_TABLE} (
            id INT NOT NULL AUTO_INCREMENT,
            employee VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            warning_date DATE NOT NULL,
            description TEXT NOT NULL,
            evidence_file VARCHAR(255) NULL,
            issued_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    `);
};

const normalizeWarning = (row) => ({
    ...row,
    id: row.id ?? row.warning_id ?? null,
    warning_id: row.warning_id ?? row.id ?? null,
    warning_date: row.warning_date ?? row.date ?? null,
});

const getWarningIdColumn = async () => {
    await ensureWarningsTable();
    const [idRows] = await db.query(`SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'id'`);
    if (idRows.length) return "id";

    const [warningIdRows] = await db.query(`SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'warning_id'`);
    if (warningIdRows.length) return "warning_id";

    return "id";
};

const getWarningDateColumn = async () => {
    await ensureWarningsTable();
    const [warningDateRows] = await db.query(
        `SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'warning_date'`
    );
    if (warningDateRows.length) return "warning_date";

    const [dateRows] = await db.query(`SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'date'`);
    if (dateRows.length) return "date";

    return "warning_date";
};

const getWarnings = async (req, res) => {
    try {
        await ensureWarningsTable();
        const idColumn = await getWarningIdColumn();
        const dateColumn = await getWarningDateColumn();
        const [rows] = await db.query(
            `SELECT *
             FROM ${WARNING_TABLE}
             ORDER BY ${dateColumn} DESC, ${idColumn} DESC`
        );

        res.status(200).json({ data: rows.map(normalizeWarning) });
    } catch (err) {
        console.log("WARNING LIST ERROR:", err);
        res.status(500).json({ message: "Failed to fetch warnings" });
    }
};

const createWarning = async (req, res) => {
    try {
        await ensureWarningsTable();
        const { employee, title, category, description } = req.body;
        const warningDate = req.body.warning_date || req.body.date;
        const dateColumn = await getWarningDateColumn();

        if (!employee || !title || !category || !warningDate || !description) {
            return res.status(400).json({ message: "All required fields must be filled." });
        }

        const evidence = req.file ? req.file.filename : null;
        const issuedBy = req.user?.id ?? req.user?.user_id ?? req.user?.userId ?? null;

        if (!issuedBy) {
            return res.status(401).json({ message: "Invalid user session. Please login again." });
        }

        try {
            await db.query(
                `INSERT INTO ${WARNING_TABLE} 
        (employee, title, category, ${dateColumn}, description, evidence_file, issued_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    employee,
                    title,
                    category,
                    warningDate,
                    description,
                    evidence,
                    issuedBy,
                ]
            );
        } catch (err) {
            // Backward compatibility for schemas without issued_by column.
            if (err.code === "ER_BAD_FIELD_ERROR" && String(err.sqlMessage).includes("issued_by")) {
                await db.query(
                    `INSERT INTO ${WARNING_TABLE} 
          (employee, title, category, ${dateColumn}, description, evidence_file)
          VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        employee,
                        title,
                        category,
                        warningDate,
                        description,
                        evidence,
                    ]
                );
            } else {
                throw err;
            }
        }

        res.status(201).json({ message: "Warning issued successfully" });
    } catch (err) {
        console.log("WARNING ERROR:", err);
        res.status(500).json({ message: "Failed to issue warning" });
    }
};

router.get("/", verifyToken, getWarnings);
router.get("/warnings", verifyToken, getWarnings);

router.post("/", verifyToken, upload.single("evidence"), createWarning);
router.post("/add", verifyToken, upload.single("evidence"), createWarning);

router.put(
    "/:id",
    verifyToken,
    upload.single("evidence"),
    async (req, res) => {
        try {
            await ensureWarningsTable();
            const { id } = req.params;
            const { employee, title, category, description } = req.body;
            const warningDate = req.body.warning_date || req.body.date;
            const evidence = req.file ? req.file.filename : null;
            const idColumn = await getWarningIdColumn();
            const dateColumn = await getWarningDateColumn();

            if (!employee || !title || !category || !warningDate || !description) {
                return res.status(400).json({ message: "All required fields must be filled." });
            }

            const [existingRows] = await db.query(
                `SELECT evidence_file FROM ${WARNING_TABLE} WHERE ${idColumn} = ?`,
                [id]
            );

            if (!existingRows.length) {
                return res.status(404).json({ message: "Warning not found" });
            }

            const evidenceFile = evidence || existingRows[0].evidence_file;

            await db.query(
                `UPDATE ${WARNING_TABLE}
                 SET employee = ?, title = ?, category = ?, ${dateColumn} = ?, description = ?, evidence_file = ?
                 WHERE ${idColumn} = ?`,
                [employee, title, category, warningDate, description, evidenceFile, id]
            );

            res.status(200).json({ message: "Warning updated successfully" });
        } catch (err) {
            console.log("WARNING UPDATE ERROR:", err);
            res.status(500).json({ message: "Failed to update warning" });
        }
    }
);

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        await ensureWarningsTable();
        const { id } = req.params;
        const idColumn = await getWarningIdColumn();
        const [result] = await db.query(`DELETE FROM ${WARNING_TABLE} WHERE ${idColumn} = ?`, [id]);

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Warning not found" });
        }

        res.status(200).json({ message: "Warning deleted successfully" });
    } catch (err) {
        console.log("WARNING DELETE ERROR:", err);
        res.status(500).json({ message: "Failed to delete warning" });
    }
});

module.exports = router;

```

---

## Utilities

### `backend/utils/hashPasswords.js`
```javascript

```

---

