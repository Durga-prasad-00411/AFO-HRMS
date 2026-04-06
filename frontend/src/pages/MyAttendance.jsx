import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, Avatar, Tooltip, 
  Select, MenuItem, FormControl, InputLabel, CircularProgress 
} from "@mui/material";
import { 
  FaClock, FaUserTimes, FaUmbrellaBeach, FaCheckCircle, FaCalendarCheck, FaChevronRight 
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";

const MyAttendance = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalPresent: 0, totalAbsent: 0, totalLeave: 0, totalHoliday: 0 });
    const [loading, setLoading] = useState(true);
    const [daysInMonth, setDaysInMonth] = useState(31);
    const [searchTerm, setSearchTerm] = useState("");

    const API_URL = "http://localhost:5000/api/attendance/grid";
    const token = localStorage.getItem("token");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}?month=${month}&year=${year}&my=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.data);
            setSummary(res.data.summary);
            setDaysInMonth(res.data.daysInMonth);
        } catch (error) {
            console.error("Error fetching grid data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PRESENT': return <FaCheckCircle style={{ color: '#10b981', fontSize: '14px' }} />;
            case 'ABSENT': return <FaUserTimes style={{ color: '#ef4444', fontSize: '14px' }} />;
            case 'HOLIDAY': return <FaCalendarCheck style={{ color: '#10b981', fontSize: '14px' }} />;
            case 'LEAVE': return <FaUmbrellaBeach style={{ color: '#ef4444', fontSize: '14px' }} />;
            case 'HALF_DAY': return <FaClock style={{ color: '#ef4444', fontSize: '14px' }} />;
            case 'WEEKEND': return <span style={{ color: '#94a3b8', fontSize: '10px' }}>-</span>;
            default: return <span style={{ color: '#e2e8f0' }}>-</span>;
        }
    };

    const filteredData = data.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700} color="#1e293b">Attendance Summary</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="body2" color="#64748b" component={Link} to="/superadmin" sx={{ textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Dashboard</Typography>
                    <Box sx={{ color: '#94a3b8', display: 'flex' }}><FaChevronRight size={10} /></Box>
                    <Typography variant="body2" color="#64748b">Attendance</Typography>
                    <Box sx={{ color: '#94a3b8', display: 'flex' }}><FaChevronRight size={10} /></Box>
                    <Typography variant="body2" color="#1e293b" fontWeight={600}>My Attendance</Typography>
                </Box>
            </Box>

            {/* Legend & Filters Card */}
            <Paper sx={{ p: 3, borderRadius: '16px', mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Legend Icons with Real Data */}
                    <Grid item xs={12} lg={7} sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ p: 1, borderRadius: '8px', color: '#ef4444', bgcolor: '#fef2f2', display: 'flex', position: 'relative' }}>
                                <FaClock />
                                <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#ef4444', color: 'white', fontSize: '10px', px: 0.5, borderRadius: '4px', fontWeight: 700 }}>0</Box>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#64748b">Half Days</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ p: 1, borderRadius: '8px', color: '#ef4444', bgcolor: '#fef2f2', display: 'flex', position: 'relative' }}>
                                <FaUserTimes />
                                <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#ef4444', color: 'white', fontSize: '10px', px: 0.5, borderRadius: '4px', fontWeight: 700 }}>{summary.totalAbsent}</Box>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#64748b">Absent</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ p: 1, borderRadius: '8px', color: '#ef4444', bgcolor: '#fef2f2', display: 'flex', position: 'relative' }}>
                                <FaUmbrellaBeach />
                                <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#ef4444', color: 'white', fontSize: '10px', px: 0.5, borderRadius: '4px', fontWeight: 700 }}>{summary.totalLeave}</Box>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#64748b">On Leave</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ p: 1, borderRadius: '8px', color: '#10b981', bgcolor: '#ecfdf5', display: 'flex', position: 'relative' }}>
                                <FaCheckCircle />
                                <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#10b981', color: 'white', fontSize: '10px', px: 0.5, borderRadius: '4px', fontWeight: 700 }}>{summary.totalPresent}</Box>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#64748b">Present</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ p: 1, borderRadius: '8px', color: '#10b981', bgcolor: '#ecfdf5', display: 'flex', position: 'relative' }}>
                                <FaCalendarCheck />
                                <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#10b981', color: 'white', fontSize: '10px', px: 0.5, borderRadius: '4px', fontWeight: 700 }}>{summary.totalHoliday}</Box>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#64748b">Holiday</Typography>
                        </Box>
                    </Grid>

                    {/* Filters */}
                    <Grid item xs={12} lg={5}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                <Select value={year} onChange={(e) => setYear(e.target.value)} sx={{ borderRadius: '12px' }}>
                                    {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select value={month} onChange={(e) => setMonth(e.target.value)} sx={{ borderRadius: '12px' }}>
                                    {months.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Attendance Grid Table */}
            <Paper sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#fdfdfd', borderBottom: '1px solid #f1f5f9' }}>
                                    <th style={{ padding: '20px', textAlign: 'left', minWidth: '280px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 10 }}>Employee</th>
                                    {[...Array(daysInMonth)].map((_, i) => (
                                        <th key={i} style={{ padding: '12px', textAlign: 'center', minWidth: '35px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                                        <td style={{ padding: '15px 20px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar src={row.photo ? `http://localhost:5000${row.photo}` : ""} sx={{ width: 42, height: 42, bgcolor: '#6366f1', fontSize: '14px', borderRadius: '12px' }}>{row.name.charAt(0)}</Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ lineHeight: 1.2 }}>{row.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>{row.employee_code}</Typography>
                                                    <Box sx={{ fontSize: '10px', color: '#94a3b8', mt: 0.2 }}>{row.designation || 'Staff'} - {row.location}</Box>
                                                </Box>
                                            </Box>
                                        </td>
                                        {[...Array(daysInMonth)].map((_, i) => {
                                            const dayKey = String(i + 1).padStart(2, '0');
                                            const status = row.days[dayKey];
                                            return (
                                                <td key={i} style={{ textAlign: 'center', padding: '10px' }}>
                                                    <Tooltip title={`${row.name} (${row.employee_code})\nDate: ${dayKey}/${month}/${year}\nStatus: ${status || 'Scheduled'}`} arrow>
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            {getStatusIcon(status)}
                                                        </Box>
                                                    </Tooltip>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default MyAttendance;
