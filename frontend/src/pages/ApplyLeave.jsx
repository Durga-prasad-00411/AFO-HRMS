import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Box, Card, CardContent, Typography, TextField, MenuItem, 
  Button, IconButton, Alert, CircularProgress, Grid,
  ToggleButton, ToggleButtonGroup, Paper, Divider
} from "@mui/material";
import { 
  ArrowBack as ArrowBackIcon, 
  Send as SendIcon,
  InfoOutlined as InfoIcon,
  RotateRight as ResetIcon,
  TrendingFlat as CarryIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const ApplyLeave = () => {
    const navigate = useNavigate();
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoad, setPageLoad] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    
    const [form, setForm] = useState({ 
        leave_type: "", 
        start_date: new Date().toISOString().split('T')[0], 
        end_date: new Date().toISOString().split('T')[0], 
        reason: "",
        duration_choice: "FULL" // FULL | HALF
    });

    useEffect(() => {
        const fetchAll = async () => {
            const token = localStorage.getItem("token");
            try {
                const [ltRes, balRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/leave-types", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("http://localhost:5000/api/leave-balances/my-balances", { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setLeaveTypes(ltRes.data.filter(t => t.status === "Active"));
                setLeaveBalances(balRes.data);
            } catch (err) {
                console.error("Failed to load application data");
                setErrorMsg("Failed to load leave balances.");
            } finally { setPageLoad(false); }
        };
        fetchAll();
    }, []);

    const selectedBalance = leaveBalances.find(b => b.leave_name === form.leave_type);

    const calcDuration = () => {
        if (form.duration_choice === "HALF") return 0.5;
        if (!form.start_date || !form.end_date) return 0;
        const diff = Math.ceil((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    };

    const requestedDuration = calcDuration();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        if (requestedDuration <= 0) {
            setErrorMsg("Invalid date range.");
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const payload = {
                ...form,
                duration: requestedDuration
            };
            await axios.post("http://localhost:5000/api/leaves/apply", payload, { headers: { Authorization: `Bearer ${token}` } });
            navigate(-1);
        } catch (error) { 
            setErrorMsg(error.response?.data?.message || "Failed to apply for leave"); 
        } finally { setLoading(false); }
    };

    if (pageLoad) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: 900, margin: "40px auto", px: 3 }}>
            {/* Header with Background */}
            <Paper sx={{ 
                borderRadius: 5, 
                overflow: 'hidden', 
                mb: 4, 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
            }}>
                <Box sx={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
                    p: 4, 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', background: 'rgba(255,255,255,0.1)' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>Request Leave</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Select your leave type and dates to submit for verification</Typography>
                    </Box>
                </Box>

                <CardContent sx={{ p: 5 }}>
                    {errorMsg && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{errorMsg}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={5}>
                            {/* Left Column: Form Fields */}
                            <Grid item xs={12} md={7}>
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="overline" fontWeight={700} color="primary" sx={{ mb: 1, display: 'block' }}>• LEAVE CATEGORY</Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        value={form.leave_type}
                                        onChange={(e) => setForm({...form, leave_type: e.target.value})}
                                        variant="outlined"
                                        placeholder="Choose a policy type..."
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                    >
                                        <MenuItem value=""><em>Choose a policy type...</em></MenuItem>
                                        {leaveTypes.map(t => (
                                            <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Box>

                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="overline" fontWeight={700} color="primary" sx={{ mb: 1, display: 'block' }}>• DURATION CHOICE</Typography>
                                    <ToggleButtonGroup
                                        value={form.duration_choice}
                                        exclusive
                                        onChange={(e, val) => val && setForm({...form, duration_choice: val})}
                                        fullWidth
                                        sx={{ gap: 2 }}
                                    >
                                        <ToggleButton value="FULL" sx={{ 
                                            borderRadius: '12px !important', 
                                            border: '1px solid #e2e8f0 !important',
                                            py: 2,
                                            flexDirection: 'column',
                                            '&.Mui-selected': { background: '#eff6ff', borderColor: '#3b82f6 !important', color: '#1e40af' }
                                        }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Full Day</Typography>
                                            <Typography variant="caption">1.0 Unit</Typography>
                                        </ToggleButton>
                                        <ToggleButton value="HALF" sx={{ 
                                            borderRadius: '12px !important', 
                                            border: '1px solid #e2e8f0 !important',
                                            py: 2,
                                            flexDirection: 'column',
                                            '&.Mui-selected': { background: '#eff6ff', borderColor: '#3b82f6 !important', color: '#1e40af' }
                                        }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Half Day</Typography>
                                            <Typography variant="caption">0.5 Units</Typography>
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>

                                <Grid container spacing={3} sx={{ mb: 4 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="overline" fontWeight={700} color="primary" sx={{ mb: 1, display: 'block' }}>STARTING ON</Typography>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={form.start_date}
                                            onChange={(e) => setForm({...form, start_date: e.target.value})}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="overline" fontWeight={700} color="primary" sx={{ mb: 1, display: 'block' }}>ENDING ON</Typography>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: form.start_date }}
                                            disabled={form.duration_choice === 'HALF'}
                                            value={form.duration_choice === 'HALF' ? form.start_date : form.end_date}
                                            onChange={(e) => setForm({...form, end_date: e.target.value})}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Right Column: Entitlement Info */}
                            <Grid item xs={12} md={5}>
                                <Box sx={{ 
                                    height: '100%', 
                                    background: '#f8fafc', 
                                    borderRadius: 4, 
                                    p: 4, 
                                    border: '2px dashed #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}>
                                    {selectedBalance ? (
                                        <>
                                            <InfoIcon sx={{ fontSize: 48, color: '#3b82f6', mb: 2 }} />
                                            <Typography variant="h5" fontWeight={800} color="#1e293b">{selectedBalance.remaining_days} Units</Typography>
                                            <Typography variant="body2" color="#64748b">Current entitlement for <strong>{form.leave_type}</strong></Typography>
                                            <Box sx={{ mt: 3, p: 2, background: 'white', borderRadius: 2, width: '100%', border: '1px solid #e2e8f0' }}>
                                                <Typography variant="body2" fontWeight={600}>Requested Duration</Typography>
                                                <Typography variant="h6" fontWeight={800} color="primary">{requestedDuration} Units</Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <InfoIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                                            <Typography variant="body2" color="#94a3b8">Please select a leave policy type to view your current entitlement.</Typography>
                                        </>
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="overline" fontWeight={700} color="primary" sx={{ mb: 1, display: 'block' }}>REASON FOR ABSENCE</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={form.reason}
                                    onChange={(e) => setForm({...form, reason: e.target.value})}
                                    placeholder="Describe the purpose of your leave (e.g., family emergency, vacation, medical appt)..."
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    size="large"
                                    disabled={loading || (selectedBalance && requestedDuration > selectedBalance.remaining_days)}
                                    sx={{ 
                                        flexGrow: 2, 
                                        borderRadius: 3, 
                                        py: 2, 
                                        background: '#3b82f6',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        '&:hover': { background: '#2563eb' }
                                    }}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                >
                                    SEND REQUEST
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    size="large"
                                    onClick={() => navigate(-1)}
                                    sx={{ 
                                        flexGrow: 1, 
                                        borderRadius: 3, 
                                        py: 2, 
                                        borderColor: '#e2e8f0', 
                                        color: '#64748b',
                                        fontWeight: 700,
                                        textTransform: 'none'
                                    }}
                                >
                                    DISCARD
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Paper>

            {/* Bottom Section: Remaining Portfolio */}
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', mb: 3 }}>Remaining Portfolio</Typography>
            <Grid container spacing={4}>
                {leaveBalances.map(bal => (
                    <Grid item xs={12} sm={6} md={4} key={bal.leave_name}>
                        <Card sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#64748b" sx={{ mb: 2 }}>{bal.leave_name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                                    <Typography variant="h4" fontWeight={800}>{bal.remaining_days}</Typography>
                                    <Typography variant="body2" color="#94a3b8">units</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: bal.carry_forward ? '#10b981' : '#f59e0b' }}>
                                    {bal.carry_forward ? <CarryIcon fontSize="small" /> : <ResetIcon fontSize="small" />}
                                    <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                        {bal.carry_forward ? 'Rolls Over' : 'Monthly Reset'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ApplyLeave;

