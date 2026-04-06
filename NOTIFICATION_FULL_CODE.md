# NOTIFICATION SYSTEM - COMPLETE FULL SOURCE CODE

Below is the **100% full, unabbreviated source code** for every file that was created and modified to implement the automated Notification system.

---

### 1. `database_queries.sql` (New Table Addition)
```sql
-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### 2. `backend/routes/notificationRoutes.js` (NEW FILE)
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

### 3. `backend/controllers/notificationController.js` (NEW FILE)
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

### 4. EXISTING FILES WE ADDED LINES TO

**`backend/server.js`**: We added the routing logic for `/api/notifications` to the server configuration.
```javascript
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);
```

**`backend/controllers/performanceController.js`**: We injected the notification trigger inside `submitReview`.
```javascript
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
```

**`backend/controllers/payrollController.js`**: We injected the notification trigger inside `generatePayroll`.
```javascript
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
```

---

### 5. `frontend/src/components/Navbar.jsx` (MODIFIED FULL FILE CODE)

We completely updated the global top-navigation bar to actively poll the backend for these notifications, map them to an interactive dropdown interface, and handle unread state counts shown on the bell-badge icon. 

Here is what the entire `Navbar.jsx` looks like now:

```javascript
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Paper,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Badge from "@mui/material/Badge";
import axios from 'axios';

const parseJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((ch) => `%${`00${ch.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return {};
  }
};

const Navbar = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const companyName = "Genesys Info X";
  const roleFromStorage = localStorage.getItem("role") || "SUPER_ADMIN";

  const token = localStorage.getItem("token");
  const jwtData = token ? parseJwt(token) : {};

  const userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("name") ||
    localStorage.getItem("username") ||
    "Admin";
  const userEmail =
    localStorage.getItem("email") || jwtData.email || "admin@company.com";
  const userRole = roleFromStorage.replace("_", " ");
  const userPhone = localStorage.getItem("phone") || "+91 98765 43210";
  const userEmployeeNumber =
    localStorage.getItem("employeeNumber") ||
    localStorage.getItem("user_id") ||
    `${jwtData.id || "001"}`;
  const userAddress = localStorage.getItem("address") || "Chennai, Tamil Nadu";
  const userPhoto = localStorage.getItem("profilePhoto") || "";

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const open = Boolean(anchorEl);
  const openNotifications = Boolean(notificationAnchorEl);

  const [notifications, setNotifications] = useState([]);
  
  const userId = localStorage.getItem("user_id") || jwtData.id;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/${userId}`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/read-all/${userId}`);
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenProfile = () => {
    setOpenProfileDialog(true);
    handleClose();
  };

  const handleCloseProfile = () => {
    setOpenProfileDialog(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        color: "#000",
        borderBottom: "1px solid #eee",
        zIndex: 1300,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isMobile && (
            <IconButton onClick={onMenuClick}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" fontWeight={500}>
            {companyName}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notificationAnchorEl}
            open={openNotifications}
            onClose={handleNotificationClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ sx: { width: 320, maxHeight: 400, mt: 1, borderRadius: 2 } }}
          >
            <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: '1px solid #eee' }}>
              <Typography fontWeight={600}>Notifications</Typography>
              {unreadCount > 0 && (
                <Typography 
                  variant="caption" 
                  color="primary" 
                  onClick={handleMarkAllAsRead}
                  sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                >
                  Mark all as read
                </Typography>
              )}
            </Box>
            
            {notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: '#888' }}>
                <Typography variant="body2">No notifications yet</Typography>
              </Box>
            ) : (
              notifications.map((notif) => (
                <MenuItem 
                  key={notif.id} 
                  onClick={() => {
                    if (!notif.is_read) handleMarkAsRead(notif.id);
                  }}
                  sx={{ 
                    whiteSpace: 'normal', 
                    borderBottom: '1px solid #f5f5f5', 
                    bgcolor: notif.is_read ? 'transparent' : '#f0f9ff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 1.5
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: notif.is_read ? 500 : 700, color: '#1e293b' }}>
                    {notif.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: '0.8rem' }}>
                    {notif.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, fontSize: '0.7rem' }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </Typography>
                </MenuItem>
              ))
            )}
          </Menu>

          <IconButton size="small" onClick={handleProfileClick}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: "#0e0e0f",
                fontSize: "14px",
              }}
            >
              {userName.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ sx: { width: 230, mt: 1, borderRadius: 2 } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography fontWeight={600}>{userName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
              <Box sx={{ fontSize: 12, fontWeight: 600, mt: 0.5 }}>{userRole}</Box>
            </Box>

            <Divider />

            <MenuItem onClick={handleOpenProfile}>My Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>

          <Dialog
            open={openProfileDialog}
            onClose={handleCloseProfile}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle sx={{ fontWeight: 700 }}>My Profile</DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      border: "1px solid #ececec",
                      borderRadius: 3,
                      p: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 220,
                    }}
                  >
                    <Avatar
                      src={userPhoto}
                      alt={userName}
                      sx={{
                        width: 130,
                        height: 130,
                        fontSize: 40,
                        bgcolor: "#0e0e0f",
                      }}
                    >
                      {userName.charAt(0)}
                    </Avatar>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Paper
                    elevation={0}
                    sx={{ border: "1px solid #ececec", borderRadius: 3, p: 2 }}
                  >
                    <Typography sx={{ mb: 1.5 }}>
                      <strong>Name:</strong> {userName}
                    </Typography>
                    <Typography sx={{ mb: 1.5 }}>
                      <strong>Phone:</strong> {userPhone}
                    </Typography>
                    <Typography sx={{ mb: 1.5 }}>
                      <strong>Number:</strong> {userEmployeeNumber}
                    </Typography>
                    <Typography sx={{ mb: 1.5 }}>
                      <strong>Gmail:</strong> {userEmail}
                    </Typography>
                    <Typography>
                      <strong>Address:</strong> {userAddress}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
          </Dialog>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
```
