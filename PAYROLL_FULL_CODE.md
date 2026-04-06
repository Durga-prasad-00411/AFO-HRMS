# PAYROLL & PAYSLIP SYSTEM - COMPLETE FULL SOURCE CODE

Below is the **100% full, unabbreviated source code** for every file that was created and modified to implement the Payroll and Payslip system.

---

### 1. `database_queries.sql` (New Table Addition)
```sql
CREATE TABLE payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(10, 2) DEFAULT 0,
    hra DECIMAL(10, 2) DEFAULT 0,
    allowances DECIMAL(10, 2) DEFAULT 0,
    pf_deduction DECIMAL(10, 2) DEFAULT 0,
    tax_deduction DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) DEFAULT 0,
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'GENERATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE KEY unique_payroll_month (employee_id, month, year)
);
```

---

### 2. `backend/routes/payrollRoutes.js` (NEW FILE)
```javascript
const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");

router.post("/generate", payrollController.generatePayroll);
router.get("/", payrollController.getAllPayrolls);
router.get("/employee/:userId", payrollController.getEmployeePayrolls);
router.put("/:id/status", payrollController.updatePayrollStatus);

module.exports = router;
```

---

### 3. `backend/controllers/payrollController.js` (NEW FILE)
```javascript
const pool = require("../config/db");

// Get all payrolls
exports.getAllPayrolls = async (req, res) => {
  try {
    const query = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, u.email 
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY p.year DESC, p.month DESC, p.id DESC
    `;
    const [payrolls] = await pool.query(query);
    res.status(200).json(payrolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payrolls" });
  }
};

// Get payrolls by user ID
exports.getEmployeePayrolls = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, e.joining_date, d.name AS designation, dept.name as department
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN departments dept ON e.department_id = dept.id
      WHERE u.id = ?
      ORDER BY p.year DESC, p.month DESC
    `;
    const [payrolls] = await pool.query(query, [userId]);
    res.status(200).json(payrolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee payrolls" });
  }
};

// Generate Payroll
exports.generatePayroll = async (req, res) => {
  try {
    const {
      employee_id,
      month,
      year,
      basic_salary,
      hra,
      allowances,
      pf_deduction,
      tax_deduction,
      net_salary,
      payment_date,
    } = req.body;

    if (!employee_id || !month || !year || !net_salary) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    const query = `
      INSERT INTO payroll 
      (employee_id, month, year, basic_salary, hra, allowances, pf_deduction, tax_deduction, net_salary, payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GENERATED')
    `;

    const values = [
      employee_id, month, year, 
      basic_salary || 0, hra || 0, allowances || 0, 
      pf_deduction || 0, tax_deduction || 0, net_salary, 
      payment_date || new Date().toISOString().split('T')[0]
    ];

    await pool.query(query, values);
    res.status(201).json({ message: "Payroll Generated Successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Payroll for this month and year already exists for this employee." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to generate payroll" });
  }
};

// Update Payroll Status
exports.updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE payroll SET status = ? WHERE id = ?", [status, id]);
    res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
};
```

---

### 4. `frontend/src/pages/superadmin/Payroll.jsx` (NEW FILE)
```javascript
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
    documentTitle: \`Payslip_\${viewPayslip?.employee_code || 'Doc'}\`,
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
        headers: { Authorization: \`Bearer \${localStorage.getItem("token")}\` }
      });
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payroll', {
        headers: { Authorization: \`Bearer \${localStorage.getItem("token")}\` }
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
        headers: { Authorization: \`Bearer \${localStorage.getItem("token")}\` }
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
```

---

### 5. `frontend/src/pages/Employee/MyPayslips.jsx` (NEW FILE)
```javascript
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import Payslip from '../../components/Payslip';

const MyPayslips = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [viewPayslip, setViewPayslip] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: \`My_Payslip_\${viewPayslip?.month}_\${viewPayslip?.year}\`,
  });

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      const res = await axios.get(\`http://localhost:5000/api/payroll/employee/\${userId}\`, {
        headers: { Authorization: \`Bearer \${localStorage.getItem("token")}\` }
      });
      setPayrolls(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openPayslip = (record) => {
    setViewPayslip(record);
    setOpenModal(true);
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
        My Payslips
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        View and download your monthly salary slips.
      </Typography>

      <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                 <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                 <TableCell sx={{ fontWeight: 600 }}>Payment Date</TableCell>
                 <TableCell sx={{ fontWeight: 600 }}>Net Salary</TableCell>
                 <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                 <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No payslips available yet.</TableCell></TableRow>
              ) : (
                payrolls.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.month} {row.year}</TableCell>
                    <TableCell>{new Date(row.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>₹{Number(row.net_salary).toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600,
                        bgcolor: '#dcfce7', color: '#166534'
                      }}>
                        {row.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => openPayslip(row)}
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#3b82f6' }}
                      >
                        View & Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Payslip Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Payslip Details</Typography>
          <Button variant="contained" onClick={handlePrint} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
            Download PDF
          </Button>
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
    </Box>
  );
};

export default MyPayslips;
```

---

### 6. `frontend/src/components/Payslip.jsx` (NEW FILE)
```javascript
import React from 'react';
import { Box, Typography, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

// Forward ref to capture the printable component
const Payslip = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  return (
    <Box ref={ref} sx={{ p: 4, width: '100%', maxWidth: '800px', margin: 'auto', backgroundColor: '#fff', color: '#333' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.05em' }}>
            HRMS Hero
          </Typography>
          <Typography variant="body2" color="text.secondary">
            123 Business Avenue, Tech Park
          </Typography>
          <Typography variant="body2" color="text.secondary">
            City, State 12345
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#4b5563' }}>
            PAYSLIP
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mt: 1 }}>
            {data.month} {data.year}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3, borderWidth: 1, borderColor: '#e5e7eb' }} />

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={6}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>Employee Details</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.first_name} {data.last_name}</Typography>
          <Typography variant="body2">ID: {data.employee_code || "N/A"}</Typography>
          <Typography variant="body2">Designation: {data.designation || "N/A"}</Typography>
          <Typography variant="body2">Department: {data.department || "N/A"}</Typography>
        </Grid>
        <Grid item xs={6} textAlign="right">
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>Payment Details</Typography>
          <Typography variant="body2">Payment Date: {new Date(data.payment_date).toLocaleDateString()}</Typography>
          <Typography variant="body2">Status: <span style={{ color: '#10b981', fontWeight: 600 }}>{data.status}</span></Typography>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', mb: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Earnings</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Deductions</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Basic Salary</TableCell>
              <TableCell align="right">₹{Number(data.basic_salary).toLocaleString()}</TableCell>
              <TableCell>Provident Fund (PF)</TableCell>
              <TableCell align="right">₹{Number(data.pf_deduction).toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>House Rent Allowance (HRA)</TableCell>
              <TableCell align="right">₹{Number(data.hra).toLocaleString()}</TableCell>
              <TableCell>Tax Deducted at Source (TDS)</TableCell>
              <TableCell align="right">₹{Number(data.tax_deduction).toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Other Allowances</TableCell>
              <TableCell align="right">₹{Number(data.allowances).toLocaleString()}</TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            {/* Totals Row */}
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Gross Earnings</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                ₹{(Number(data.basic_salary) + Number(data.hra) + Number(data.allowances)).toLocaleString()}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Total Deductions</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                ₹{(Number(data.pf_deduction) + Number(data.tax_deduction)).toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 4 }}>
        <Box sx={{ backgroundColor: '#eff6ff', p: 2, borderRadius: 2, border: '1px solid #bfdbfe', minWidth: '250px' }}>
          <Typography variant="overline" sx={{ color: '#1e40af', fontWeight: 700 }}>Net Pay</Typography>
          <Typography variant="h4" sx={{ color: '#1d4ed8', fontWeight: 800 }}>
            ₹{Number(data.net_salary).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 8, color: '#94a3b8' }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" sx={{ display: 'block' }}>
          This is a computer generated payslip and does not require a signature.
        </Typography>
      </Box>

    </Box>
  );
});

export default Payslip;
```

---

### 7. EXISTING FILES WE ADDED LINES TO

**`backend/server.js`**: Added these lines:
```javascript
const payrollRoutes = require("./routes/payrollRoutes");
app.use("/api/payroll", payrollRoutes);
```

**`frontend/src/App.jsx`**: Added imports and nested routes:
```javascript
// IMPORT
import Payroll from "./pages/superadmin/Payroll";
import MyPayslips from "./pages/employee/MyPayslips";

// ROUTE 1 (Under Super Admin)
<Route path="payroll" element={<Payroll />} />
<Route path="mypayslips" element={<MyPayslips />} />

// ROUTE 2 (Under HR Admin, Manager, TeamLead, Employee)
<Route path="mypayslips" element={<MyPayslips />} />
```

**`frontend/src/components/Sidebar.jsx`**: Added these exact two list items:
```javascript
        {/* Payroll (Admins Only) */}
        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => navigate("/superadmin/payroll")}
              sx={{ 
                borderRadius: '8px', 
                color: location.pathname.includes("/payroll") ? "#14b8a6" : "#4b5563",
                backgroundColor: location.pathname.includes("/payroll") ? "#ccfbf1" : "transparent"
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
              if (role === "SUPER_ADMIN" || role === "ADMIN") navigate("/superadmin/mypayslips");
              else if (role === "HR") navigate("/admin/mypayslips");
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
```
