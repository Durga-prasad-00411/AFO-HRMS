import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, Grid, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import Payslip from '../../components/Payslip';

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  const [month, setMonth] = useState('January');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [basic, setBasic] = useState(0);
  const [hra, setHra] = useState(0);
  const [allowances, setAllowances] = useState(0);
  const [pf, setPf] = useState(0);
  const [tax, setTax] = useState(0);
  const [netSalary, setNetSalary] = useState(0);
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [viewPayslip, setViewPayslip] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  
  const printRef = useRef();
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payslip_${viewPayslip?.employee_code || 'Doc'}`,
  });

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, []);

  useEffect(() => {
    const gross = Number(basic) + Number(hra) + Number(allowances);
    const deductions = Number(pf) + Number(tax);
    setNetSalary(gross - deductions);
  }, [basic, hra, allowances, pf, tax]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payroll', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setPayrolls(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      setToast({ open: true, message: 'Please select an employee', severity: 'error' });
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/payroll/generate', {
        employee_id: selectedEmployee,
        month,
        year,
        basic_salary: basic,
        hra,
        allowances,
        pf_deduction: pf,
        tax_deduction: tax,
        net_salary: netSalary
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setToast({ open: true, message: 'Payroll generated successfully!', severity: 'success' });
      fetchPayrolls();
      
      // Reset form
      setBasic(0); setHra(0); setAllowances(0); setPf(0); setTax(0);
      setSelectedEmployee('');
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.error || 'Error generating payroll', severity: 'error' });
    }
  };

  const openPayslip = (record) => {
    setViewPayslip(record);
    setOpenModal(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
        Payroll Management
      </Typography>

      <Grid container spacing={3}>
        {/* Generate Form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Generate Payroll</Typography>
            
            <TextField
              select
              fullWidth
              label="Select Employee"
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              sx={{ mb: 2 }}
            >
              {employees.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                >
                  {months.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  fullWidth
                  label="Year"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#64748b' }}>Earnings</Typography>
            <TextField fullWidth type="number" label="Basic Salary" value={basic} onChange={e => setBasic(e.target.value)} sx={{ mb: 2 }} />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="HRA" value={hra} onChange={e => setHra(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Allowances" value={allowances} onChange={e => setAllowances(e.target.value)} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#64748b' }}>Deductions</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="PF" value={pf} onChange={e => setPf(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Tax" value={tax} onChange={e => setTax(e.target.value)} />
              </Grid>
            </Grid>

            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 1, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Net Salary:</Typography>
              <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>₹{netSalary.toLocaleString()}</Typography>
            </Box>

            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleGenerate}
              sx={{ py: 1.5, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Generate Payroll
            </Button>
          </Paper>
        </Grid>

        {/* Generated Payrolls Table */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Payrolls</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                     <TableCell>ID</TableCell>
                     <TableCell>Employee</TableCell>
                     <TableCell>Period</TableCell>
                     <TableCell>Net Salary</TableCell>
                     <TableCell>Status</TableCell>
                     <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payrolls.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No payrolls found.</TableCell></TableRow>
                  ) : (
                    payrolls.map(row => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.employee_code}</TableCell>
                        <TableCell>{row.first_name} {row.last_name}</TableCell>
                        <TableCell>{row.month} {row.year}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>₹{Number(row.net_salary).toLocaleString()}</TableCell>
                        <TableCell>
                          <Box sx={{ 
                            display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600,
                            bgcolor: row.status === 'GENERATED' ? '#dcfce7' : '#e0e7ff',
                            color: row.status === 'GENERATED' ? '#166534' : '#3730a3'
                          }}>
                            {row.status}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => openPayslip(row)}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            View Payslip
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Payslip Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Generated Payslip</Typography>
          <Button variant="contained" color="primary" onClick={handlePrint}>Download / Print PDF</Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
          {viewPayslip && (
            <div style={{ padding: '20px' }}>
              <Payslip data={viewPayslip} ref={printRef} />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fff' }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payroll;
