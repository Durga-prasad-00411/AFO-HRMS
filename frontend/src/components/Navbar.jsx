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
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const handleNotificationItemClick = async (notif) => {
    // 1. Mark as read if not already
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }

    // 2. Close menu
    handleNotificationClose();

    // 3. Navigate if type exists
    if (notif.type) {
        let prefix = "/dashboard";
        const role = roleFromStorage.toUpperCase();
        
        if (role === "SUPER_ADMIN") prefix = "/superadmin";
        else if (role === "ADMIN" || role === "HR") prefix = "/admin";
        else if (role === "MANAGER") prefix = "/manager";
        else if (["TL", "TEAM_LEAD", "TEAMLEADER"].includes(role)) prefix = "/teamlead";

        switch (notif.type) {
            case 'LEAVE_REQUEST':
                navigate(`${prefix}/leaves`);
                break;
            case 'PAYROLL_GENERATED':
                navigate(`${prefix}/mypayslips`);
                break;
            case 'PERFORMANCE_REVIEW':
                navigate(`${prefix}/myperformance`);
                break;
            default:
                break;
        }
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
                  onClick={() => handleNotificationItemClick(notif)}
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
