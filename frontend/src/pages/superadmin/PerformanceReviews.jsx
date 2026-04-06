import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, Grid, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Snackbar, Alert, Rating
} from '@mui/material';

const PerformanceReviews = () => {
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchEmployees();
    fetchReviews();
  }, []);

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

  const fetchReviews = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/performance', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      setToast({ open: true, message: 'Please select an employee', severity: 'error' });
      return;
    }
    if (rating < 1 || rating > 5) {
      setToast({ open: true, message: 'Please provide a valid rating (1-5)', severity: 'error' });
      return;
    }
    
    try {
      const reviewerId = localStorage.getItem("user_id"); // using local storage to get current user

      await axios.post('http://localhost:5000/api/performance/submit', {
        employee_id: selectedEmployee,
        reviewer_id: reviewerId,
        review_date: new Date().toISOString().split('T')[0],
        rating: rating,
        feedback: feedback
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setToast({ open: true, message: 'Performance review submitted successfully!', severity: 'success' });
      fetchReviews();
      
      // Reset form
      setSelectedEmployee('');
      setRating(0);
      setFeedback('');
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.error || 'Error submitting review', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
        Performance Reviews Management
      </Typography>

      <Grid container spacing={3}>
        {/* Submit Review Form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Submit New Review</Typography>
            
            <TextField
              select
              fullWidth
              label="Select Employee"
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              sx={{ mb: 3 }}
            >
              {employees.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ mb: 3 }}>
              <Typography component="legend" sx={{ mb: 1, color: '#64748b', fontWeight: 500 }}>Overall Rating</Typography>
              <Rating
                name="performance-rating"
                value={rating}
                onChange={(event, newValue) => {
                  setRating(newValue);
                }}
                size="large"
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Feedback & Comments"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="Provide constructive feedback on the employee's performance..."
            />

            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleSubmit}
              sx={{ py: 1.5, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Submit Review
            </Button>
          </Paper>
        </Grid>

        {/* All Reviews Table */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>All Employee Reviews</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                     <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                     <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                     <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                     <TableCell sx={{ fontWeight: 600 }}>Feedback</TableCell>
                     <TableCell sx={{ fontWeight: 600 }}>Reviewer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No reviews found.</TableCell></TableRow>
                  ) : (
                    reviews.map(row => (
                      <TableRow key={row.id} hover>
                        <TableCell>{new Date(row.review_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.employee_first_name} {row.employee_last_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.employee_code}</Typography>
                        </TableCell>
                        <TableCell>
                          <Rating value={row.rating} readOnly size="small" />
                        </TableCell>
                        <TableCell sx={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.feedback}>
                          {row.feedback || "No feedback provided"}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.reviewer_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>{row.reviewer_role}</Typography>
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

export default PerformanceReviews;
