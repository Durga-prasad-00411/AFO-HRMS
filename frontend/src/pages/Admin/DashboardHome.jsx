import React, { useEffect, useState } from "react";
import { FaUsers, FaCalendarCheck, FaClock, FaGift, FaLaptop, FaExclamationTriangle, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Typography, Modal, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import AttendancePanel from "../../components/AttendancePanel";
import "../../styles/dashboard.css";

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeaveToday: 0,
    assetsCount: 0,
    warningsCount: 0,
    awardsIssued: 0
  });

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [todayEmployees, setTodayEmployees] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch employees
        let empCount = 0;
        try {
            const empRes = await fetch("http://localhost:5000/api/employees", { headers });
            if (empRes.ok) {
                const employees = await empRes.json();
                empCount = Array.isArray(employees) ? employees.length : 0;
            }
        } catch (e) {}

        // Fetch assets
        let assetsCount = 0;
        try {
            const assetRes = await fetch("http://localhost:5000/api/assets", { headers });
            if (assetRes.ok) {
                const assets = await assetRes.json();
                assetsCount = Array.isArray(assets) ? assets.length : 0;
            }
        } catch (e) {}

        // Fetch warnings
        let warningsCount = 0;
        try {
            const warningRes = await fetch("http://localhost:5000/api/warnings", { headers });
            if (warningRes.ok) {
                const warnings = await warningRes.json();
                warningsCount = Array.isArray(warnings?.data) ? warnings.data.length : 0;
            }
        } catch (e) {}

        // Fetch today attendance for 'presentToday'
        let presentToday = 0;
        try {
            const attRes = await fetch("http://localhost:5000/api/attendance/summary", { headers });
            if (attRes.ok) {
                const attData = await attRes.json();
                presentToday = attData.checkedIn || 0;
            }
        } catch (e) {}

        setStats({
          totalEmployees: empCount,
          presentToday: presentToday,
          onLeaveToday: 0,
          assetsCount: assetsCount,
          warningsCount: warningsCount,
          awardsIssued: 0
        });

      } catch (error) {
        console.error("Dashboard stats fetch error:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleAttendanceClick = async () => {
    setAttendanceModalOpen(true);
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("http://localhost:5000/api/attendance/today", {
             headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
             const data = await res.json();
             setTodayEmployees(data);
        }
    } catch (err) {
        console.error("Failed to fetch logged in employees", err);
    }
  };

  const statCards = [
    { title: "My Team", value: stats.totalEmployees, icon: FaUsers, color: "#3b82f6", bgColor: "#eff6ff" },
    { title: "Attendance", value: stats.presentToday, icon: FaClock, color: "#10b981", bgColor: "#ecfdf5", onClick: handleAttendanceClick },
    { title: "Assets", value: stats.assetsCount, icon: FaLaptop, color: "#06b6d4", bgColor: "#ecfeff" },
    { title: "Warnings", value: stats.warningsCount, icon: FaExclamationTriangle, color: "#ef4444", bgColor: "#fef2f2" },
    { title: "Leave Requests", value: stats.onLeaveToday, icon: FaCalendarCheck, color: "#f59e0b", bgColor: "#fffbeb" },
    { title: "Team Awards", value: stats.awardsIssued, icon: FaGift, color: "#8b5cf6", bgColor: "#f5f3ff" }
  ];

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100%" }}>
      <Box sx={{ mb: 4 }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Manage your department and team operations.</p>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <AttendancePanel />
        </Grid>

        <Grid item xs={12} lg={8}>
          <Grid container spacing={2}>
            {statCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <div
                  className="stat-card"
                  onClick={() => card.onClick ? card.onClick() : (card.link ? navigate(card.link) : null)}
                  style={{ borderLeft: `4px solid ${card.color}`, cursor: 'pointer' }}
                >
                  <div className="stat-card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    <div>
                      <span className="stat-title" style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{card.title}</span>
                      <h2 className="stat-value" style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700' }}>{card.value}</h2>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: card.bgColor }}>
                      <card.icon style={{ color: card.color, fontSize: '20px' }} />
                    </div>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #f1f5f9' }}>
                  <FaUsers style={{ color: '#3b82f6', fontSize: '24px' }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Roster</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #f1f5f9' }}>
                  <FaCalendarAlt style={{ color: '#f59e0b', fontSize: '24px' }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Approvals</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Attendance Modal */}
      <Modal open={attendanceModalOpen} onClose={() => setAttendanceModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '90%', md: 600 }, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4, maxHeight: '80vh', overflowY: 'auto'
        }}>
           <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">Today's Attendance Status</Typography>
              <IconButton onClick={() => setAttendanceModalOpen(false)}><CloseIcon /></IconButton>
           </Box>
           <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table>
                 <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                       <TableCell>Employee Code</TableCell>
                       <TableCell>Name</TableCell>
                       <TableCell>Check-In Time</TableCell>
                       <TableCell>Check-Out Time</TableCell>
                       <TableCell>Status</TableCell>
                    </TableRow>
                 </TableHead>
                 <TableBody>
                    {todayEmployees.length > 0 ? (
                        todayEmployees.map((emp, idx) => (
                           <TableRow key={idx}>
                              <TableCell>{emp.employee_code}</TableCell>
                              <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                              <TableCell>{emp.check_in || 'N/A'}</TableCell>
                              <TableCell>{emp.check_out || 'N/A'}</TableCell>
                              <TableCell>
                                <span style={{ padding: '4px 8px', borderRadius: '4px', background: emp.status === 'CHECKED_IN' ? '#ecfdf5' : '#f1f5f9', color: emp.status === 'CHECKED_IN' ? '#10b981' : '#64748b' }}>
                                    {emp.status}
                                </span>
                              </TableCell>
                           </TableRow>
                        ))
                    ) : (
                        <TableRow>
                           <TableCell colSpan={5} align="center">No employees found.</TableCell>
                        </TableRow>
                    )}
                 </TableBody>
              </Table>
           </TableContainer>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminDashboardHome;
