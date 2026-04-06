import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../styles/holidays.css";

const AddShift = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id || location.state);
    const editData = location.state;

    const [formData, setFormData] = useState({
        shiftName: "",
        clockIn: "",
        clockOut: "",
        lateMarkAfter: "",
        earlyClockIn: "",
        allowClockOutTill: "",
        workModeId: "",
    });

    const [workModes, setWorkModes] = useState([]);


    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (editData) {
            setFormData({
                shiftName: editData.shift_name || "",
                clockIn: editData.clock_in || "",
                clockOut: editData.clock_out || "",
                lateMarkAfter: editData.late_mark_after || "",
                earlyClockIn: editData.early_clock_in || "",
                allowClockOutTill: editData.allow_clock_out || "",
                workModeId: editData.work_mode_id || "",
            });
        } else if (id) {
            // Fetch if only ID is present
            fetch(`http://localhost:5000/api/shifts/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
                .then(res => res.json())
                .then(data => {
                    setFormData({
                        shiftName: data.shift_name || "",
                        clockIn: data.clock_in || "",
                        clockOut: data.clock_out || "",
                        lateMarkAfter: data.late_mark_after || "",
                        earlyClockIn: data.early_clock_in || "",
                        allowClockOutTill: data.allow_clock_out || "",
                        workModeId: data.work_mode_id || "",
                    });
                })
                .catch(err => console.error(err));
        }

        // Fetch work modes
        fetch("http://localhost:5000/api/shifts/work-modes", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => res.json())
            .then(data => setWorkModes(data))
            .catch(err => console.error("Error fetching work modes:", err));

    }, [editData, id]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const url = isEditMode
            ? `http://localhost:5000/api/shifts/${id || editData.id}`
            : "http://localhost:5000/api/shifts/add";

        const method = isEditMode ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setIsError(false);
                setMessage(data.message || "Operation successful");
                alert(data.message || "Operation successful");
                setTimeout(() => navigate("/superadmin/shifts"), 1500);
            } else {
                setIsError(true);
                setMessage(data.message || "Something went wrong on the server");
                alert(data.message || "Something went wrong on the server");
            }
        } catch (err) {
            console.error("Shift submit error:", err);
            setIsError(true);
            setMessage("Network error or server is down");
            alert("Network error or server is down");
        }
    };

    return (
        <div className="holiday-card">
            <div className="holiday-content">

                <h2>{isEditMode ? "Edit Shift" : "Add Shift"}</h2>

                {message && (
                    <div style={{
                        padding: "10px",
                        margin: "10px 0",
                        borderRadius: "4px",
                        backgroundColor: isError ? "#f8d7da" : "#d4edda",
                        color: isError ? "#721c24" : "#155724",
                        border: `1px solid ${isError ? "#f5c6cb" : "#c3e6cb"}`,
                        textAlign: "center",
                        fontWeight: "bold"
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="row">
                        <div className="form-group">
                            <label>Shift Name <span className="required">*</span></label>
                            <input
                                type="text"
                                name="shiftName"
                                value={formData.shiftName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Work Mode <span className="required">*</span></label>
                            <select
                                name="workModeId"
                                value={formData.workModeId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Work Mode</option>
                                {workModes.map(mode => (
                                    <option key={mode.id} value={mode.id}>
                                        {mode.mode_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="row">
                        <div className="form-group">
                            <label>Clock In <span className="required">*</span></label>
                            <input
                                type="time"
                                name="clockIn"
                                value={formData.clockIn}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Clock Out <span className="required">*</span></label>
                            <input
                                type="time"
                                name="clockOut"
                                value={formData.clockOut}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>



                    <div className="row">
                        <div className="form-group">
                            <label>Early Clock In <span className="required">*</span></label>
                            <input
                                type="time"
                                name="earlyClockIn"
                                value={formData.earlyClockIn}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Allow Clock Out Till <span className="required">*</span></label>
                            <input
                                type="time"
                                name="allowClockOutTill"
                                value={formData.allowClockOutTill}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Late Mark After <span className="required">*</span> (minutes)</label>
                        <input
                            type="number"
                            name="lateMarkAfter"
                            value={formData.lateMarkAfter}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="button-bar">
                        <button type="submit" className="btn-add">
                            {isEditMode ? "Update Shift" : "Add Shift"}
                        </button>

                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddShift;