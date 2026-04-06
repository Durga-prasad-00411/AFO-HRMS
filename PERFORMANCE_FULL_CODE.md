# PERFORMANCE REVIEW SYSTEM - COMPLETE FULL SOURCE CODE

Below is the **100% full, unabbreviated source code** for every file that was created and modified to implement the Performance Review system.

---

### 1. `database_queries.sql` (New Table Addition)
```sql
CREATE TABLE performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    review_date DATE NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

---

### 2. `backend/routes/performanceRoutes.js` (NEW FILE)
```javascript
const express = require("express");
const router = express.Router();
const performanceController = require("../controllers/performanceController");

router.post("/submit", performanceController.submitReview);
router.get("/", performanceController.getAllReviews);
router.get("/employee/:userId", performanceController.getEmployeeReviews);

module.exports = router;

```

---

### 3. `backend/controllers/performanceController.js` (NEW FILE)
```javascript
const pool = require("../config/db");

// Get all performance reviews
exports.getAllReviews = async (req, res) => {
  try {
    const query = `
      SELECT pr.*, e.first_name AS employee_first_name, e.last_name AS employee_last_name, 
             e.employee_code, u.username AS reviewer_name, d.name AS department, r.role_name AS reviewer_role
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON pr.reviewer_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY pr.review_date DESC, pr.id DESC
    `;
    const [reviews] = await pool.query(query);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch performance reviews" });
  }
};

// Get performance reviews for a specific employee (based on their user ID)
exports.getEmployeeReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT pr.*, u.username AS reviewer_name, r.role_name AS reviewer_role
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON pr.reviewer_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE e.user_id = ?
      ORDER BY pr.review_date DESC
    `;
    const [reviews] = await pool.query(query, [userId]);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee performance reviews" });
  }
};

// Submit a new performance review
exports.submitReview = async (req, res) => {
  try {
    const { employee_id, reviewer_id, review_date, rating, feedback } = req.body;

    if (!employee_id || !reviewer_id || !review_date || !rating) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const query = `
      INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, rating, feedback, status)
      VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
    `;

    const values = [employee_id, reviewer_id, review_date, rating, feedback || ""];
    
    await pool.query(query, values);
    
    res.status(201).json({ message: "Performance Review Submitted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit performance review" });
  }
};

```

---

### 4. `frontend/src/pages/superadmin/PerformanceReviews.jsx` (NEW FILE)
```javascript
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

```

---

### 5. `frontend/src/pages/Employee/MyPerformance.jsx` (NEW FILE)
```javascript
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

```

---

### 6. EXISTING FILES WE ADDED LINES TO

**`backend/server.js`**: Added these lines:
```javascript
const performanceRoutes = require("./routes/performanceRoutes");
app.use("/api/performance", performanceRoutes);
```

**`frontend/src/App.jsx`**: Added imports and nested routes:
```javascript
// IMPORT
import PerformanceReviews from "./pages/superadmin/PerformanceReviews";
import MyPerformance from "./pages/Employee/MyPerformance";

// ROUTE 1 (Under Super Admin)
<Route path="performance" element={<PerformanceReviews />} />
<Route path="myperformance" element={<MyPerformance />} />

// ROUTE 2 (Under HR Admin, Manager, TeamLead, Employee dashboards)
<Route path="myperformance" element={<MyPerformance />} />
```

**`frontend/src/components/Sidebar.jsx`**: Added these exact conditionally rendered list items:
```javascript
        {/* Performance (Admin/Manager/HR Only) */}
        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "MANAGER" || userRole === "HR") && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => navigate("/superadmin/performance")}
              sx={{ 
                borderRadius: '8px', 
                color: isActive("/superadmin/performance") ? "#8b5cf6" : "#4b5563",
                backgroundColor: isActive("/superadmin/performance") ? "#ede9fe" : "transparent"
              }}
            >
              <FaChartLine style={{ marginRight: 12, fontSize: 18, color: '#8b5cf6' }} />
              <ListItemText primary="Performance Reviews" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        )}

        {/* My Performance (All Employees) */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={() => {
              const role = localStorage.getItem("role");
              if (role === "SUPER_ADMIN" || role === "ADMIN") navigate("/superadmin/myperformance");
              else if (role === "HR") navigate("/admin/myperformance");
              else if (role === "MANAGER") navigate("/manager/myperformance");
              else if (role === "TL" || role === "TEAM_LEAD") navigate("/teamlead/myperformance");
              else navigate("/dashboard/myperformance");
            }}
            sx={{ 
              borderRadius: '8px', 
              color: location.pathname.includes("myperformance") ? "#eab308" : "#4b5563",
              backgroundColor: location.pathname.includes("myperformance") ? "#fef08a" : "transparent"
            }}
          >
            <FaStar style={{ marginRight: 12, fontSize: 18, color: '#eab308' }} />
            <ListItemText primary="My Performance" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
```
