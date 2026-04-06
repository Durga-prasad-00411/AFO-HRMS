import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="dashboard">
      <Sidebar role={role} />

      <div className="main">
        <Navbar role={role} />

        <div className="content">
          <h1>Dashboard</h1>
          <p>Welcome</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
