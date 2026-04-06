/* Visual Accrual Tracker with Healthy/Limited/Critical Status */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaUser, FaHistory, FaArrowRight, FaUndo } from "react-icons/fa";

const LeaveBalances = () => {
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "HR"].includes(userRole);

    const fetchBalances = async () => {
        try {
            setLoading(true);
            const url = isAdmin ? "http://localhost:5000/api/leave-balances/all-balances" : "http://localhost:5000/api/leave-balances/my-balances";
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setBalances(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchBalances(); }, []);

    return (
        <div className="simple-container" style={{ padding: "20px" }}>
            <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>{isAdmin ? "Global Accruals" : "My Leave Portfolio"}</h2>
            {loading ? <p>Loading balances...</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {balances.map((b, i) => (
                    <div key={i} className="balance-card" style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 15px 0", color: "#334155", fontSize: "16px", display: "flex", justifyContent: "space-between" }}>
                            {isAdmin && <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "normal" }}>{b.first_name} {b.last_name} ({b.employee_code})</span>}
                            <span>{b.leave_name}</span>
                        </h4>
                        <div className="usage-bar" style={{ background: "#f1f5f9", height: "10px", borderRadius: "5px", overflow: "hidden", marginBottom: "15px" }}>
                            <div className="usage-progress" style={{ 
                                width: `${Math.min(100, (b.remaining_days / (b.total_days || 1)) * 100)}%`, 
                                height: "100%", 
                                background: (b.remaining_days / (b.total_days || 1)) > 0.5 ? "#10b981" : (b.remaining_days / (b.total_days || 1)) > 0.2 ? "#f59e0b" : "#ef4444",
                                transition: "width 0.5s ease-in-out"
                            }} />
                        </div>
                        <p style={{ margin: "0 0 10px 0", color: "#475569" }}>Remaining: <strong style={{ fontSize: "18px", color: "#0f172a" }}>{b.remaining_days}</strong> / {b.total_days} days</p>
                        <small style={{ display: "flex", gap: "10px", alignItems: "center", color: "#64748b" }}>
                            {b.carry_forward ? <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaArrowRight color="#3b82f6"/> Rolls Over</span> : <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaUndo color="#ef4444"/> Resets Monthly</span>}
                            <span>| Accrual: +{b.monthly_accrual}d</span>
                        </small>
                    </div>
                ))}
                {balances.length === 0 && <p style={{ color: "#64748b" }}>No balance records found.</p>}
            </div>
            )}
        </div>
    );
};
export default LeaveBalances;
