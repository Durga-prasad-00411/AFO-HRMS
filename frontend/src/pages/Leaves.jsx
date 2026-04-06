import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  IconButton, Chip, TextField, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Avatar
} from "@mui/material";
import { 
  Add as AddIcon, 
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FolderOpen as FolderIcon,
  QueryBuilder as PendingIcon,
  EventAvailable as ApprovedIcon,
  CancelOutlined as DeclinedIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "../styles/tables.css";

const MetricCard = ({ title, value, icon, color, bg }) => (
    <Paper elevation={0} sx={{ 
        p: 2, 
        borderRadius: 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: '#fff',
        border: '1px solid #e2e8f0',
        flex: 1,
        minWidth: '200px'
    }}>
        <Box sx={{ 
            p: 1.2, 
            borderRadius: 2, 
            bgcolor: bg, 
            color: color,
            display: 'flex',
            alignItems: 'center'
        }}>
            {React.cloneElement(icon, { sx: { fontSize: 24 } })}
        </Box>
        <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', lineHeight: 1.2 }}>
                {title}
            </Typography>
            <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 800, mt: 0.2 }}>
                {value || 0}
            </Typography>
        </Box>
    </Paper>
);

const Leaves = () => {
    const navigate = useNavigate();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterRole, setFilterRole] = useState("All");
    
    const userRole = localStorage.getItem("role")?.toUpperCase() || "";
    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("user_id");

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/api/leaves", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleAction = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/leaves/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLeaves();
        } catch (error) { 
            alert(error.response?.data?.message || "Failed to update status"); 
        }
    };

    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isAdmin = userRole === "ADMIN";
    const isHR = userRole === "HR";
    const isManager = userRole === "MANAGER";
    const isTL = ["TL", "TEAM_LEAD", "TEAMLEADER"].includes(userRole);

    const canApprove = (leave) => {
        if (!leave) return false;
        if (String(leave.user_id) === String(currentUserId)) return false;

        const applicantRole = leave.applicant_role_name?.toUpperCase() || "";
        
        if (applicantRole === "MANAGER") {
            return isSuperAdmin || isAdmin || isHR;
        } else if (applicantRole === "ADMIN" || applicantRole === "HR") {
            return isSuperAdmin || isAdmin || isHR;
        } else if (applicantRole === "SUPER_ADMIN") {
            return isSuperAdmin;
        }

        return isSuperAdmin || isAdmin || isHR || isManager || isTL;
    };

    const filteredLeaves = leaves.filter(l => {
        const matchesSearch = (l.first_name + " " + l.last_name).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "All" || l.status === filterStatus.toUpperCase();
        
        let matchesRole = true;
        if (filterRole !== "All") {
            const applicantRole = l.applicant_role_name?.toUpperCase() || "";
            if (filterRole === "TL") {
                matchesRole = ["TL", "TEAM_LEAD", "TEAMLEADER"].includes(applicantRole);
            } else {
                matchesRole = applicantRole === filterRole;
            }
        }

        return matchesSearch && matchesStatus && matchesRole;
    });

    // Calculate Metrics
    const metrics = {
        aggregate: leaves.reduce((sum, l) => sum + parseFloat(l.duration || 0), 0),
        pending: leaves.filter(l => l.status === "PENDING").reduce((sum, l) => sum + parseFloat(l.duration || 0), 0),
        approved: leaves.filter(l => l.status === "APPROVED").reduce((sum, l) => sum + parseFloat(l.duration || 0), 0),
        declined: leaves.filter(l => l.status === "REJECTED").reduce((sum, l) => sum + parseFloat(l.duration || 0), 0)
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED':
                return { bg: '#dcfce7', text: '#16a34a' }; // green-100, green-600
            case 'REJECTED':
                return { bg: '#fee2e2', text: '#ef4444' }; // red-100, red-500
            case 'PENDING':
                return { bg: '#fffbeb', text: '#f59e0b' }; // amber-100, amber-500
            default:
                return { bg: '#e2e8f0', text: '#475569' }; // slate-200, slate-600
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <div className="simple-container theme-indigo">
            <h2 className="page-title">Leave Management</h2>

            {/* Compact Metrics Row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                <MetricCard
                    title="Total Leaves"
                    value={metrics.aggregate}
                    icon={<FolderIcon />}
                    color="#3b82f6"
                    bg="#eff6ff"
                />
                <MetricCard
                    title="Pending"
                    value={metrics.pending}
                    icon={<PendingIcon />}
                    color="#eab308"
                    bg="#fefce8"
                />
                <MetricCard
                    title="Approved"
                    value={metrics.approved}
                    icon={<ApprovedIcon />}
                    color="#10b981"
                    bg="#ecfdf5"
                />
                <MetricCard
                    title="Declined"
                    value={metrics.declined}
                    icon={<DeclinedIcon />}
                    color="#ef4444"
                    bg="#fef2f2"
                />
            </Box>

            {/* Top Bar matching Shifts UI */}
            <div className="top-bar">
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        className="small-btn"
                        onClick={() => {
                            const role = userRole.toUpperCase();
                            if (role === "SUPER_ADMIN") navigate("/superadmin");
                            else if (role === "ADMIN" || role === "HR") navigate("/admin");
                            else if (role === "MANAGER") navigate("/manager");
                            else if (["TL", "TEAM_LEAD", "TEAMLEADER"].includes(role)) navigate("/teamlead");
                            else navigate("/dashboard");
                        }}
                        style={{ backgroundColor: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FaArrowLeft style={{ fontSize: '14px' }} /> Dashboard
                    </button>
                    {userRole !== "SUPER_ADMIN" && (
                        <button
                            className="small-btn"
                            onClick={() => {
                                const role = userRole.toUpperCase();
                                if (role === "ADMIN" || role === "HR") navigate("/admin/apply-leave");
                                else if (role === "MANAGER") navigate("/manager/apply-leave");
                                else if (["TL", "TEAM_LEAD", "TEAMLEADER"].includes(role)) navigate("/teamlead/apply-leave");
                                else navigate("/dashboard/apply-leave");
                            }}
                        >
                            + Submit New Leave
                        </button>
                    )}

                    {/* Status Filter inside Top Bar */}
                    <div className="search-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 10px', background: '#fff' }}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ border: 'none', background: 'none', height: '100%', outline: 'none', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                        >
                            <option value="All">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Declined</option>
                        </select>
                    </div>

                    {/* Role Filter inside Top Bar */}
                    <div className="search-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 10px', background: '#fff' }}>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            style={{ border: 'none', background: 'none', height: '100%', outline: 'none', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                        >
                            <option value="All">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="HR">HR</option>
                            <option value="MANAGER">Manager</option>
                            <option value="TL">Team Leader</option>
                        </select>
                    </div>
                </div>

                <div className="search-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <SearchIcon style={{ position: 'absolute', right: '12px', color: '#94a3b8' }} />
                </div>
            </div>

            {/* Table Area */}
            <div className="table-wrapper">
                <table className="leave-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Duration (Units)</th>
                            <th>Dates</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.map((l) => (
                            <tr key={l.id}>
                                <td>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', color: '#475569', fontSize: '14px', fontWeight: 700 }}>
                                            {l.first_name?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                                {l.first_name} {l.last_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                {l.employee_code}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </td>
                                <td>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                                        {l.leave_type}
                                    </Typography>
                                </td>
                                <td>
                                    <Chip
                                        label={`${parseFloat(l.duration || 0).toFixed(2)} Units`}
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            bgcolor: '#f8fafc',
                                            color: '#64748b',
                                            border: '1px solid #e2e8f0'
                                        }}
                                    />
                                </td>
                                <td>
                                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                                        {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                    </Typography>
                                </td>
                                <td>
                                    <Chip
                                        label={l.status}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.7rem',
                                            bgcolor: getStatusColor(l.status).bg,
                                            color: getStatusColor(l.status).text,
                                            border: `1px solid ${getStatusColor(l.status).text}15`
                                        }}
                                    />
                                </td>
                                <td>
                                    {l.status === 'PENDING' && canApprove(l) ? (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(l.id, 'APPROVED')}
                                                sx={{ color: '#10b981', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' } }}
                                            >
                                                <CheckIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(l.id, 'REJECTED')}
                                                sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                            Finalized
                                        </Typography>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLeaves.length === 0 && (
                    <Box sx={{ p: 8, textAlign: 'center', background: '#fff' }}>
                        <Typography variant="body1" sx={{ color: '#94a3b8' }}>No leave requests found</Typography>
                    </Box>
                )}
            </div>
        </div>
    );
};

export default Leaves;
