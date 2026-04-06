/* Policy Configuration Management */
import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LeaveType = () => {
    const navigate = useNavigate();
    const [leaveTypes, setLeaveTypes] = useState([]);
    const token = localStorage.getItem("token");

    const fetchLeaveTypes = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/leave-types", { headers: { Authorization: `Bearer ${token}` } });
            setLeaveTypes(response.data);
        } catch(e) {
            console.error(e);
        }
    };

    useEffect(() => { fetchLeaveTypes(); }, []);

    return (
        <div className="simple-container" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#1e293b" }}>Leave Policies Configuration</h2>
                <button 
                    onClick={() => navigate("/superadmin/add-leave-type")}
                    style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}
                >
                    <FaPlus /> New Policy
                </button>
            </div>
            
            <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                            <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Policy Name</th>
                            <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Type</th>
                            <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Monthly Accrual</th>
                            <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Rollover</th>
                            <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveTypes.map(t => (
                            <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0", "&:last-child": { borderBottom: "none" } }}>
                                <td style={{ padding: "14px 16px", fontWeight: 500, color: "#1e293b" }}>{t.name}</td>
                                <td style={{ padding: "14px 16px", color: "#64748b" }}>{t.type}</td>
                                <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: "bold" }}>+{t.monthlyAccrual} days/mo</td>
                                <td style={{ padding: "14px 16px" }}>
                                    <span style={{ padding: "4px 8px", background: t.carryForward ? "#dbeafe" : "#f1f5f9", color: t.carryForward ? "#1d4ed8" : "#475569", borderRadius: "4px", fontSize: "12px" }}>
                                        {t.carryForward ? "Enabled" : "Monthly Reset"}
                                    </span>
                                </td>
                                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                    <button 
                                        onClick={() => navigate(`/superadmin/edit-leave-type/${t.id}`)}
                                        style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "6px", borderRadius: "4px", color: "#64748b", cursor: "pointer" }}
                                    >
                                        <FaEdit/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default LeaveType;