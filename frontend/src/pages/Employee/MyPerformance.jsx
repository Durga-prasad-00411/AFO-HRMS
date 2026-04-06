import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Rating, Card, CardContent
} from '@mui/material';

const MyPerformance = () => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      const res = await axios.get(`http://localhost:5000/api/performance/employee/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const data = res.data;
      setReviews(data);
      
      if (data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating((sum / data.length).toFixed(1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
        My Performance
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        View your performance reviews and feedback from management.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: '#475569', mb: 1 }}>Overall Rating</Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                {averageRating}
              </Typography>
              <Rating value={Number(averageRating)} readOnly precision={0.1} size="large" />
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                Based on {reviews.length} review(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Review History</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                 <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                 <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                 <TableCell sx={{ fontWeight: 600 }}>Feedback</TableCell>
                 <TableCell sx={{ fontWeight: 600 }}>Reviewed By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>No performance reviews available yet.</TableCell></TableRow>
              ) : (
                reviews.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>{new Date(row.review_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Rating value={row.rating} readOnly size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
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
    </Box>
  );
};

export default MyPerformance;
