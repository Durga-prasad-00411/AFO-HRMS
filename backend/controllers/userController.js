exports.getDashboard = (req, res) => {
  res.json({
    message: "Welcome to HRMS Dashboard",
    userId: req.user.id,
  });
};