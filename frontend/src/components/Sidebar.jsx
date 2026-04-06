import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Collapse,
  Divider,
  Typography
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { 
  FaTachometerAlt, FaUsers, FaMedal, FaCalendarCheck, 
  FaCalendarAlt, FaShieldAlt, FaSignOutAlt, FaLaptop,
  FaFileAlt, FaBullhorn, FaExclamationCircle, FaUserTimes, FaMoneyBillWave, FaFileInvoiceDollar, FaChartLine, FaStar
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({
  mobileOpen,
  handleDrawerToggle,
  isMobile,
  drawerWidth,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openEmployees, setOpenEmployees] = useState(false);
  const [openAttendance, setOpenAttendance] = useState(false);
  const [openLeaves, setOpenLeaves] = useState(false);
  const [openAppreciation, setOpenAppreciation] = useState(false);
  const [openAssets, setOpenAssets] = useState(false);
  const [openOffboardings, setOpenOffboardings] = useState(false);

  // Attendance Summary State
  const [summary, setSummary] = useState({ checkedIn: 0, checkedOut: 0 });
  const userRole = localStorage.getItem("role");
  const prefix = userRole === "SUPER_ADMIN" ? "/superadmin" : (userRole === "ADMIN" ? "/admin" : (userRole === "HR" ? "/hr" : ""));

  useEffect(() => {
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
      fetchSummary();
      const interval = setInterval(fetchSummary, 30000); // 30s update
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const fetchSummary = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance/summary", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSummary(res.data);
    } catch (error) {
      console.error("Summary error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #f3f4f6",
        px: 1,
      }}
    >
      <Box sx={{ p: '24px 20px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          width: 36, 
          height: 36, 
          borderRadius: '10px', 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 900
        }}>
          H
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#000080', letterSpacing: '0.02em', lineHeight: 1 }}>
            HRMS
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 1, opacity: 0.5 }} />
      <List sx={{ px: 1 }}>

        {/* Dashboard */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={() => {
              const role = localStorage.getItem("role");
              if (role === "SUPER_ADMIN" || role === "ADMIN") navigate(`${prefix}`);
              else if (role === "HR") navigate(`${prefix}`);
              else if (role === "MANAGER") navigate("/manager");
              else if (role === "TL" || role === "TEAM_LEAD") navigate("/teamlead");
              else navigate("/dashboard");
            }}
            sx={{ 
              borderRadius: '8px',
              backgroundColor: location.pathname.includes("dashboard") || location.pathname === `${prefix}` || location.pathname === `${prefix}` || location.pathname === "/manager" || location.pathname === "/teamlead" ? "#eff6ff" : "transparent",
              color: "#3b82f6",
              '&:hover': { backgroundColor: "#f3f4f6" }
            }}
          >
            <FaTachometerAlt style={{ marginRight: 12, fontSize: 18 }} />
            <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>

        {/* Employees - Only for SuperAdmin and Admin */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => setOpenEmployees(!openEmployees)}
                sx={{ 
                  borderRadius: '8px',
                  color: "#4b5563",
                  '&:hover': { backgroundColor: "#f3f4f6" }
                }}
              >
                <FaUsers style={{ marginRight: 12, fontSize: 18, color: '#3b82f6' }} />
                <ListItemText primary="Employees" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                {openEmployees ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openEmployees} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { text: "All Employees", path: `${prefix}/employee` },
                  { text: "New Employee", path: `${prefix}/addemployee` },
                  { text: "Departments", path: `${prefix}/departments` },
                  { text: "Designations", path: `${prefix}/designations` },
                  { text: "Shifts", path: `${prefix}/shifts` },
                ].map((subItem) => (
                  <ListItem key={subItem.path} disablePadding>
                    <ListItemButton 
                      sx={{ 
                        pl: 6, py: 0.5,
                        color: isActive(subItem.path) ? "#3b82f6" : "#4b5563",
                        fontWeight: isActive(subItem.path) ? 600 : 400
                      }} 
                      onClick={() => navigate(subItem.path)}
                    >
                      <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Appreciation - Only for SuperAdmin and Admin */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => setOpenAppreciation(!openAppreciation)}
                sx={{ borderRadius: '8px', color: "#4b5563" }}
              >
                <FaMedal style={{ marginRight: 12, fontSize: 18, color: '#8b5cf6' }} />
                <ListItemText primary="Appreciation" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                {openAppreciation ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={openAppreciation} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { text: "Appreciation", path: `${prefix}/appreciation` },
                  { text: "Award", path: `${prefix}/award` },
                ].map((subItem) => (
                  <ListItem key={subItem.path} disablePadding>
                    <ListItemButton 
                      sx={{ 
                        pl: 6, py: 0.5,
                        color: isActive(subItem.path) ? "#8b5cf6" : "#4b5563"
                      }} 
                      onClick={() => navigate(subItem.path)}
                    >
                      <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Attendance */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "HR") && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => setOpenAttendance(!openAttendance)}
                sx={{ borderRadius: '8px', color: "#4b5563" }}
              >
                <FaCalendarCheck style={{ marginRight: 12, fontSize: 18, color: '#10b981' }} />
                <ListItemText primary="Attendance" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                {openAttendance ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={openAttendance} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  // If HR, they only get Attendance Details right now in App.jsx routing
                  ...(userRole === "SUPER_ADMIN" || userRole === "ADMIN" ? [
                    { text: "Add Attendance", path: `${prefix}/add-attendance` },
                    { text: "Attendance Details", path: `${prefix}/attendance-details` },
                    { text: "Attendance Summary", path: `${prefix}/attendance-summary` },
                    ...(userRole !== "SUPER_ADMIN" ? [{ text: "My Attendance", path: `${prefix}/my-attendance` }] : []),
                  ] : [
                    { text: "Attendance Details", path: `${prefix}/attendance-details` },
                    { text: "My Attendance", path: `${prefix}/my-attendance` },
                  ])
                ].map((subItem) => (
                  <ListItem key={subItem.path} disablePadding>
                    <ListItemButton 
                      sx={{ 
                        pl: 6, py: 0.5,
                        color: isActive(subItem.path) ? "#10b981" : "#4b5563"
                      }} 
                      onClick={() => navigate(subItem.path)}
                    >
                      <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}


        {/* Leaves */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={() => setOpenLeaves(!openLeaves)}
            sx={{ borderRadius: '8px', color: "#4b5563" }}
          >
            <FaCalendarAlt style={{ marginRight: 12, fontSize: 18, color: '#f59e0b' }} />
            <ListItemText primary="Leaves" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            {openLeaves ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>

        <Collapse in={openLeaves} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") ? (
              [
                ...(userRole !== "SUPER_ADMIN" ? [{ text: "Apply Leave", path: `${prefix}/apply-leave` }] : []),
                { text: "All Leaves", path: `${prefix}/leaves` },
                ...(userRole !== "SUPER_ADMIN" ? [{ text: "My Leaves", path: `${prefix}/my-leaves` }] : []),
                { text: "Leave Balances", path: `${prefix}/leave-balances` },
                { text: "Leave Types", path: `${prefix}/leave-types` },
              ].map((subItem) => (
                <ListItem key={subItem.path} disablePadding>
                  <ListItemButton 
                    sx={{ pl: 6, py: 0.5, color: isActive(subItem.path) ? "#f59e0b" : "#4b5563" }} 
                    onClick={() => navigate(subItem.path)}
                  >
                    <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13 }} />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              [
                { 
                  text: "Apply Leave", 
                  path: userRole === "HR" ? "/admin/apply-leave" 
                      : userRole === "MANAGER" ? "/manager/apply-leave" 
                      : (userRole === "TL" || userRole === "TEAM_LEAD" || userRole === "TEAMLEADER") ? "/teamlead/apply-leave" 
                      : "/dashboard/apply-leave" 
                },
                { 
                  text: "My Leaves", 
                  path: userRole === "HR" ? "/admin/leaves" 
                      : userRole === "MANAGER" ? "/manager/leaves" 
                      : (userRole === "TL" || userRole === "TEAM_LEAD" || userRole === "TEAMLEADER") ? "/teamlead/leaves" 
                      : "/dashboard/leaves" 
                },
                { 
                  text: "Leave Balances", 
                  path: userRole === "HR" ? "/admin/leave-balances" 
                      : userRole === "MANAGER" ? "/manager/leave-balances" 
                      : (userRole === "TL" || userRole === "TEAM_LEAD" || userRole === "TEAMLEADER") ? "/teamlead/leave-balances" 
                      : "/dashboard/leave-balances" 
                },
              ].map((subItem) => (
                <ListItem key={subItem.path} disablePadding>
                  <ListItemButton 
                    sx={{ pl: 6, py: 0.5, color: isActive(subItem.path) ? "#f59e0b" : "#4b5563" }} 
                    onClick={() => navigate(subItem.path)}
                  >
                    <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13 }} />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Collapse>


        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => navigate(`${prefix}/companypolicies`)}
              sx={{ 
                borderRadius: '8px', 
                color: isActive(`${prefix}/companypolicies`) ? "#6366f1" : "#4b5563",
                backgroundColor: isActive(`${prefix}/companypolicies`) ? "#eef2ff" : "transparent"
              }}
            >
              <FaBullhorn style={{ marginRight: 12, fontSize: 18, color: '#6366f1' }} />
              <ListItemText primary="Company Policies" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        )}

        {/* Offboardings */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => setOpenOffboardings(!openOffboardings)}
                sx={{ borderRadius: '8px', color: "#4b5563" }}
              >
                <FaExclamationCircle style={{ marginRight: 12, fontSize: 18, color: '#ef4444' }} />
                <ListItemText primary="Offboardings" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                {openOffboardings ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={openOffboardings} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { text: "Warnings", path: `${prefix}/warnings` },
                  { text: "Terminations", path: `${prefix}/terminations` },
                  { text: "Complaints", path: `${prefix}/add-complaint` },
                ].map((subItem) => (
                  <ListItem key={subItem.path} disablePadding>
                    <ListItemButton 
                      sx={{ 
                        pl: 6, py: 0.5,
                        color: isActive(subItem.path) ? "#ef4444" : "#4b5563"
                      }} 
                      onClick={() => navigate(subItem.path)}
                    >
                      <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Assets */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => setOpenAssets(!openAssets)}
                sx={{ borderRadius: '8px', color: "#4b5563" }}
              >
                <FaLaptop style={{ marginRight: 12, fontSize: 18, color: '#06b6d4' }} />
                <ListItemText primary="Assets" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                {openAssets ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={openAssets} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { text: "All Assets", path: `${prefix}/asset` },
                  { text: "Add New Asset", path: `${prefix}/add-asset` },
                  { text: "Allocate Asset", path: `${prefix}/allocate-asset` },
                ].map((subItem) => (
                  <ListItem key={subItem.path} disablePadding>
                    <ListItemButton 
                      sx={{ 
                        pl: 6, py: 0.5,
                        color: isActive(subItem.path) ? "#06b6d4" : "#4b5563"
                      }} 
                      onClick={() => navigate(subItem.path)}
                    >
                      <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Holidays */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => navigate(`${prefix}/holidays`)}
              sx={{ 
                borderRadius: '8px', 
                color: isActive(`${prefix}/holidays`) ? "#ec4899" : "#4b5563",
                backgroundColor: isActive(`${prefix}/holidays`) ? "#fdf2f8" : "transparent"
              }}
            >
              <FaCalendarCheck style={{ marginRight: 12, fontSize: 18, color: '#ec4899' }} />
              <ListItemText primary="Holidays" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        )}

        {/* Payroll (Admin Only) */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => navigate(`${prefix}/payroll`)}
              sx={{ 
                borderRadius: '8px', 
                color: isActive(`${prefix}/payroll`) ? "#14b8a6" : "#4b5563",
                backgroundColor: isActive(`${prefix}/payroll`) ? "#ccfbf1" : "transparent"
              }}
            >
              <FaMoneyBillWave style={{ marginRight: 12, fontSize: 18, color: '#14b8a6' }} />
              <ListItemText primary="Payroll" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        )}

        {/* My Payslips (All Employees) */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={() => {
              const role = localStorage.getItem("role");
              if (role === "SUPER_ADMIN" || role === "ADMIN") navigate(`${prefix}/mypayslips`);
              else if (role === "HR") navigate(`${prefix}/mypayslips`);
              else if (role === "MANAGER") navigate("/manager/mypayslips");
              else if (role === "TL" || role === "TEAM_LEAD") navigate("/teamlead/mypayslips");
              else navigate("/dashboard/mypayslips");
            }}
            sx={{ 
              borderRadius: '8px', 
              color: location.pathname.includes("mypayslips") ? "#fbbf24" : "#4b5563",
              backgroundColor: location.pathname.includes("mypayslips") ? "#fef3c7" : "transparent"
            }}
          >
            <FaFileInvoiceDollar style={{ marginRight: 12, fontSize: 18, color: '#fbbf24' }} />
            <ListItemText primary="My Payslips" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Performance (Admin/Manager/HR Only) */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "MANAGER" || userRole === "HR") && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => navigate(`${prefix}/performance`)}
              sx={{ 
                borderRadius: '8px', 
                color: isActive(`${prefix}/performance`) ? "#8b5cf6" : "#4b5563",
                backgroundColor: isActive(`${prefix}/performance`) ? "#ede9fe" : "transparent"
              }}
            >
              <FaChartLine style={{ marginRight: 12, fontSize: 18, color: '#8b5cf6' }} />
              <ListItemText primary="Performance Reviews" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        )}

        {/* My Performance (All Employees) */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={() => {
              const role = localStorage.getItem("role");
              if (role === "SUPER_ADMIN" || role === "ADMIN") navigate(`${prefix}/myperformance`);
              else if (role === "HR") navigate(`${prefix}/myperformance`);
              else if (role === "MANAGER") navigate("/manager/myperformance");
              else if (role === "TL" || role === "TEAM_LEAD") navigate("/teamlead/myperformance");
              else navigate("/dashboard/myperformance");
            }}
            sx={{ 
              borderRadius: '8px', 
              color: location.pathname.includes("myperformance") ? "#eab308" : "#4b5563",
              backgroundColor: location.pathname.includes("myperformance") ? "#fef08a" : "transparent"
            }}
          >
            <FaStar style={{ marginRight: 12, fontSize: 18, color: '#eab308' }} />
            <ListItemText primary="My Performance" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Live Attendance Summary - For Admins Only */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <Box sx={{ mt: 3, mb: 2, px: 2, py: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>Live Attendance Summary</Typography>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ color: '#10b981', fontWeight: 600, fontSize: '1rem' }}>{summary.checkedIn}</Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>Checked In</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '1rem' }}>{summary.checkedOut}</Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>Checked Out</Typography>
              </Box>
            </Box>
          </Box>
        )}

      </List>

      <Divider sx={{ mt: 'auto', mb: 1, opacity: 0.5 }} />

      {/* Logout */}
      <Box sx={{ pb: 2, px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            sx={{ borderRadius: '8px', color: "#ef4444", '&:hover': { backgroundColor: "#fef2f2" } }}
          >
            <FaSignOutAlt style={{ marginRight: 12, fontSize: 18 }} />
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              mt: "64px",
              height: "calc(100vh - 64px)",
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;