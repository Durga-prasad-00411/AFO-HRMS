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
    documentTitle: `My_Payslip_${viewPayslip?.month}_${viewPayslip?.year}`,
  });

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      const res = await axios.get(`http://localhost:5000/api/payroll/employee/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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
