import React, { useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const drawerWidth = 220;

const SuperAdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <Navbar onMenuClick={handleDrawerToggle} />

      <Box sx={{ display: "flex" }}>
        <Sidebar
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          isMobile={isMobile}
          drawerWidth={drawerWidth}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: "64px",
            background: "linear-gradient(rgba(240, 244, 248, 0.95), rgba(240, 244, 248, 0.95)), url('/src/assets/space_bg.png') center/cover no-repeat fixed",
            minHeight: "100vh",
            width: "100%",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </>
  );
};

export default SuperAdminDashboard;