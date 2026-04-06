/* Policy Configuration Form */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";

const AddLeaveType = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({ leaveName: "", leaveType: "Paid", description: "", monthlyAccrual: "0", carryForward: false, status: "Active" });

    useEffect(() => {
        if (id) {
            const fetch = async () => {
                const token = localStorage.getItem("token");
                try {
                    const res = await axios.get(`http://localhost:5000/api/leave-types/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setFormData({ 
                        leaveName: res.data.name, 
                        leaveType: res.data.type, 
                        description: res.data.description || "", 
                        monthlyAccrual: res.data.monthlyAccrual, 
                        carryForward: res.data.carryForward === 1,
                        status: res.data.status || "Active"
                    });
                } catch(e) { console.error(e); }
            };
            fetch();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const url = "http://localhost:5000/api/leave-types";
        try {
            if (id) await axios.put(`${url}/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
            else await axios.post(url, formData, { headers: { Authorization: `Bearer ${token}` } });
            navigate("/superadmin/leave-types");
        } catch(e) {
            alert(e.response?.data?.message || "Failed to save policy");
        }
    };

    return (
        <div className="simple-container" style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "20px" }}>
                <FaArrowLeft /> Back to Policies
            </button>
            <h2 style={{ marginBottom: "25px", color: "#1e293b" }}>{id ? "Edit Policy Configuration" : "New Leave Policy"}</h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontWeight: 600, color: "#475569" }}>Policy Name (e.g., Casual Leave)</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Name" 
                        value={formData.leaveName} 
                        onChange={e => setFormData({...formData, leaveName: e.target.value})} 
                        style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                        <label style={{ fontWeight: 600, color: "#475569" }}>Leave Type (Paid/Unpaid)</label>
                        <select 
                            value={formData.leaveType} 
                            onChange={e => setFormData({...formData, leaveType: e.target.value})}
                            style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                        >
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                        <label style={{ fontWeight: 600, color: "#475569" }}>Monthly Accrual (days/month)</label>
                        <input 
                            type="number" 
                            step="0.5" 
                            min="0"
                            required
                            value={formData.monthlyAccrual} 
                            onChange={e => setFormData({...formData, monthlyAccrual: e.target.value})} 
                            style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                        <label style={{ fontWeight: 600, color: "#475569" }}>Carry Forward Rule</label>
                        <select 
                            value={formData.carryForward} 
                            onChange={e => setFormData({...formData, carryForward: e.target.value === "true"})}
                            style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                        >
                            <option value="false">Monthly Reset (Lose it)</option>
                            <option value="true">Carry Forward (Keep it)</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontWeight: 600, color: "#475569" }}>Status</label>
                    <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontWeight: 600, color: "#475569" }}>Description (Optional)</label>
                    <textarea 
                        rows="3"
                        placeholder="Internal notes about this policy..." 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", resize: "vertical" }}
                    />
                </div>

                <button 
                    type="submit"
                    style={{ 
                        marginTop: "10px", padding: "14px", background: "#3b82f6", color: "#fff", 
                        border: "none", borderRadius: "6px", cursor: "pointer", 
                        fontWeight: "bold", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" 
                    }}
                >
                    <FaSave /> Save Policy
                </button>
            </form>
        </div>
    );
};
export default AddLeaveType;