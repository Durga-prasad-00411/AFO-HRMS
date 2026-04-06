import React, { useEffect, useState } from "react";
import { FaUsers, FaCalendarCheck, FaClock, FaGift, FaLaptop, FaExclamationTriangle, FaPlaneDeparture, FaCalendarAlt, FaUserPlus, FaTrophy, FaCog, FaSmile, FaTag, FaUniversity, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Typography, Modal, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Button, Stack, Tooltip } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';


import "../../styles/dashboard.css";

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    employeesUnderYou: 0,
    presentToday: 0,
    onLeaveToday: 0,
    pendingComplaints: 0,
    allocatedAssets: 0,
    upcomingHolidays: 0,
    awardsIssued: 0
  });

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [todayEmployees, setTodayEmployees] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [empRes, assetRes, compRes, holRes, awardRes, attRes] = await Promise.all([
          fetch("http://localhost:5000/api/employees", { headers }),
          fetch("http://localhost:5000/api/assets", { headers }),
          fetch("http://localhost:5000/api/complaints", { headers }),
          fetch("http://localhost:5000/api/holidays", { headers }),
          fetch("http://localhost:5000/api/awards", { headers }),
          fetch("http://localhost:5000/api/attendance/summary", { headers })
        ]);

        const emps = empRes.ok ? await empRes.json() : [];
        const assets = assetRes.ok ? await assetRes.json() : [];
        const comps = compRes.ok ? await compRes.json() : [];
        const hols = holRes.ok ? await holRes.json() : [];
        const awards = awardRes.ok ? await awardRes.json() : [];
        const attendance = attRes.ok ? await attRes.json() : {};

        const empsArray = Array.isArray(emps) ? emps : [];
        const activeCount = empsArray.filter(e => e.status === 'ACTIVE').length;
        const inactiveCount = empsArray.length - activeCount;

        setStats({
          totalEmployees: empsArray.length,
          activeEmployees: activeCount,
          inactiveEmployees: inactiveCount,
          employeesUnderYou: activeCount, 
          presentToday: attendance.checkedIn || 0,
          onLeaveToday: 0,
          pendingComplaints: (Array.isArray(comps?.data) ? comps.data : (Array.isArray(comps) ? comps : [])).length,
          allocatedAssets: (Array.isArray(assets?.data) ? assets.data : (Array.isArray(assets) ? assets : [])).length,
          upcomingHolidays: (Array.isArray(hols?.data) ? hols.data : (Array.isArray(hols) ? hols : [])).length,
          awardsIssued: (Array.isArray(awards?.data) ? awards.data : (Array.isArray(awards) ? awards : [])).length
        });

        const activityRes = await fetch("http://localhost:5000/api/activities", { headers });
        if (activityRes.ok) {
          const activities = await activityRes.json();
          if (Array.isArray(activities)) {
            const formatted = activities.map(act => {
              const timeDiff = Math.floor((new Date() - new Date(act.created_at)) / 60000);
              let timeStr = new Date(act.created_at).toLocaleDateString();
              if (timeDiff < 1) timeStr = 'Just now';
              else if (timeDiff < 60) timeStr = `${timeDiff}m ago`;
              else if (timeDiff < 1440) timeStr = `${Math.floor(timeDiff/60)}h ago`;

              return {
                text: act.activity_text,
                time: timeStr,
                color: act.color
              };
            });
            setRecentUpdates(formatted);
          }
        }

        const attTodayRes = await fetch("http://localhost:5000/api/attendance/today", { headers });
        if (attTodayRes.ok) {
           const data = await attTodayRes.json();
           setTodayEmployees(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };
    fetchDashboardStats();
  }, []);

  const handleAttendanceClick = () => setAttendanceModalOpen(true);

  const statCards = [
    { title: "Employees", value: stats.totalEmployees, icon: FaUsers, color: "#3b82f6", bgColor: "#eff6ff", link: "/superadmin/employee" },
    { title: "Attendance", value: stats.presentToday, icon: FaClock, color: "#10b981", bgColor: "#ecfdf5", onClick: handleAttendanceClick },
    { title: "Leaves", value: stats.onLeaveToday, icon: FaCalendarCheck, color: "#f59e0b", bgColor: "#fffbeb", link: "/superadmin/leaves" },
    { title: "Awards", value: stats.awardsIssued, icon: FaGift, color: "#8b5cf6", bgColor: "#f5f3ff", link: "/superadmin/appreciation" },
    { title: "Assets", value: stats.allocatedAssets, icon: FaLaptop, color: "#06b6d4", bgColor: "#ecfeff", link: "/superadmin/asset" },
    { title: "Complaints", value: stats.pendingComplaints, icon: FaExclamationTriangle, color: "#ef4444", bgColor: "#fef2f2", link: "/superadmin/add-complaint" }
  ];

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b">
            {localStorage.getItem("role") === "SUPER_ADMIN" ? "SuperAdmin Dashboard" : "Admin Dashboard"}
          </Typography>
          <Typography variant="body2" color="#64748b">Complete organization oversight and control.</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<FaPlus />} onClick={() => navigate('/superadmin/addemployee')} sx={{ borderRadius: '12px', textTransform: 'none', bgcolor: '#3b82f6' }}>Add Employee</Button>
          <IconButton sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}><FaCog style={{ color: '#64748b' }} /></IconButton>
        </Stack>
      </Box>


      <Grid container spacing={3}>
        {/* Main Dashboard Content */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Row 1: Recent Activities - full width */}
            <Grid item xs={12}>
              <Box sx={{ p: 3, bgcolor: 'white', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '320px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Recent Activities</Typography>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                  {recentUpdates.map((update, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1.5, pb: 1, borderBottom: '1px solid #f8fafc' }}>
                      <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', bgcolor: update.color || '#3b82f6', mt: 1 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '12px', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: update.text }} />
                        <Typography variant="caption" color="#94a3b8">{update.time}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Performance Row */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {statCards.map((card, idx) => (
                  <Grid item xs={12} sm={4} md={2} key={idx}>
                    <Box onClick={() => card.onClick ? card.onClick() : navigate(card.link)} sx={{ p: 2, bgcolor: 'white', borderRadius: '16px', borderLeft: `4px solid ${card.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                      <Box>
                        <Typography sx={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{card.title}</Typography>
                        <Typography variant="h6" fontWeight={800}>{card.value}</Typography>
                      </Box>
                      <Box sx={{ p: 1, borderRadius: '8px', bgcolor: card.bgColor }}><card.icon style={{ color: card.color, fontSize: '14px' }} /></Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>



      {/* Attendance Modal */}
      <Modal open={attendanceModalOpen} onClose={() => setAttendanceModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '90%', md: 600 }, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 24, p: 4, maxHeight: '80vh', overflowY: 'auto' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Today's Attendance Detail</Typography>
            <IconButton onClick={() => setAttendanceModalOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Check-In</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Check-Out</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayEmployees.map((emp, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                    <TableCell>{emp.check_in || 'N/A'}</TableCell>
                    <TableCell>{emp.check_out || 'N/A'}</TableCell>
                    <TableCell>
                      <Box sx={{ px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-block', bgcolor: emp.status === 'CHECKED_IN' ? '#ecfdf5' : '#f1f5f9', color: emp.status === 'CHECKED_IN' ? '#10b981' : '#64748b' }}>{emp.status}</Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Modal>
    </Box>
  );
};

export default DashboardHome;
