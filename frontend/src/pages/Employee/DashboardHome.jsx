import React from "react";
import { Box, Grid, Typography, Paper } from "@mui/material";
import AttendancePanel from "../../components/AttendancePanel";
import "../../styles/dashboard.css";

const EmployeeDashboardHome = () => {
    const userName = localStorage.getItem("userName") || "Employee";

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#1e293b' }}>
                    Welcome Back, {userName}! 👋
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mt: 1 }}>
                    Here's what's happening with your work profile today.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Attendance Section */}
                <Grid item xs={12} md={4}>
                    <AttendancePanel />
                </Grid>

                {/* Content removed per request */}
            </Grid>
        </Box>
    );
};

export default EmployeeDashboardHome;
