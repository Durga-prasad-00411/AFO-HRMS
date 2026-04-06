import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, MenuItem, Select, FormControl, 
  InputLabel, Card, CardContent 
} from "@mui/material";
import { FaCalendarAlt, FaCheckCircle, FaUserTimes, FaClock } from "react-icons/fa";

const FullAttendanceSummary = () => {
    const [day, setDay] = useState(0); // 0 means 'All Days'
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState({
        totalPresent: 0,
        totalAbsent: 0,
        lateArrivals: 0,
        halfDays: 0
    });

    const API_URL = "http://localhost:5000/api/attendance/monthly-logs";
    const token = localStorage.getItem("token");

    const fetchLogs = async () => {
        try {
            let url = `${API_URL}?month=${month}&year=${year}`;
            if (day > 0) url += `&day=${day}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
                
                // Calculate Summary Cards
                let present = 0;
                let absent = 0;
                let late = 0;
                
                data.forEach(log => {
                    if (log.status === 'CHECKED_IN' || log.status === 'CHECKED_OUT') {
                        present++;
                        if (log.check_in && log.check_in > "09:30:00") late++;
                    } else if (log.status === 'ABSENT') {
                        absent++;
                    }
                });
                
                setSummary({
                    totalPresent: present,
                    totalAbsent: absent,
                    lateArrivals: late,
                    halfDays: Math.floor(present * 0.05) // Placeholder logic
                });
            }
        } catch (error) {
            console.error("Error fetching monthly logs:", error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [day, month, year]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <Box sx={{ mt: 6, bgcolor: 'white', p: 3, borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: '#1e293b' }}>
                Full Attendance History
            </Typography>

            {/* Filters Row */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 100 }}>
                    <InputLabel>Day</InputLabel>
                    <Select
                        value={day}
                        label="Day"
                        onChange={(e) => setDay(e.target.value)}
                        sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                    >
                        <MenuItem value={0}>All</MenuItem>
                        {[...Array(31)].map((_, i) => (
                            <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                        value={month}
                        label="Month"
                        onChange={(e) => setMonth(e.target.value)}
                        sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                    >
                        {months.map((m, idx) => (
                            <MenuItem key={idx} value={idx + 1}>{m}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                        value={year}
                        label="Year"
                        onChange={(e) => setYear(e.target.value)}
                        sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                    >
                        {[2024, 2025, 2026].map(y => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Present", value: summary.totalPresent, icon: FaCheckCircle, color: "#10b981", bg: "#ecfdf5" },
                    { label: "Total Absents", value: summary.totalAbsent, icon: FaUserTimes, color: "#ef4444", bg: "#fef2f2" },
                    { label: "Late Arrivals", value: summary.lateArrivals, icon: FaCalendarAlt, color: "#f59e0b", bg: "#fffbeb" },
                    { label: "Half Days", value: summary.halfDays, icon: FaClock, color: "#3b82f6", bg: "#eff6ff" }
                ].map((card, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', bgcolor: '#fcfdfe' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '12px !important' }}>
                                <Box sx={{ p: 1, borderRadius: '10px', bgcolor: card.bg, color: card.color, display: 'flex' }}>
                                    <card.icon size={18} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', lineHeight: 1.2 }}>{card.value}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{card.label}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Attendance Table */}
            <TableContainer component={Paper} elevation={0} sx={{ 
                borderRadius: '20px', 
                border: '1px solid #e2e8f0',
                maxHeight: '320px', // Matches Recent Activities height for consistency
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { background: '#f8fafc' },
                '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '10px' }
            }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>Staff Name</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>Check In</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>Check Out</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.length > 0 ? logs.map((log, idx) => (
                            <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>
                                    {log.attendance_date ? new Date(log.attendance_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '--'}
                                </TableCell>
                                <TableCell sx={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{log.employee_code}</TableCell>
                                <TableCell sx={{ fontSize: '13px', fontWeight: 600 }}>{log.first_name} {log.last_name}</TableCell>
                                <TableCell sx={{ fontSize: '11px', fontWeight: 800, color: '#6366f1' }}>{log.role_name}</TableCell>
                                <TableCell sx={{ fontSize: '13px' }}>
                                    <Box sx={{ 
                                        color: log.check_in && log.check_in > "09:30:00" ? "#f59e0b" : "#1e293b", 
                                        fontWeight: log.check_in && log.check_in > "09:30:00" ? 700 : 500 
                                    }}>
                                        {log.check_in || '--:--'}
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: '13px', color: '#475569' }}>{log.check_out || '--:--'}</TableCell>
                                <TableCell>
                                    <Box sx={{ 
                                        px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '10px', fontWeight: 800,
                                        display: 'inline-block', textTransform: 'uppercase',
                                        bgcolor: log.status === 'CHECKED_OUT' ? '#ecfdf5' : log.status === 'CHECKED_IN' ? '#eff6ff' : '#fef2f2',
                                        color: log.status === 'CHECKED_OUT' ? '#10b981' : log.status === 'CHECKED_IN' ? '#3b82f6' : '#ef4444'
                                    }}>
                                        {log.status}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8', fontStyle: 'italic' }}>
                                    No records found for the selected filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default FullAttendanceSummary;
