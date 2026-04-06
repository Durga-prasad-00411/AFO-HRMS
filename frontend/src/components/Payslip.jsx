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
