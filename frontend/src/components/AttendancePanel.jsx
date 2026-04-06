import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaClock, FaSignOutAlt, FaSignInAlt } from "react-icons/fa";
import "../styles/attendance-panel.css";

const AttendancePanel = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState("NOT_CHECKED_IN");
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState(null);
    const [workType, setWorkType] = useState("OFFICE"); // OFFICE | HYBRID | WFH
    const [hybridMode, setHybridMode] = useState("OFFICE"); // choice for HYBRID employees

    const API_URL = "http://localhost:5000/api/attendance";
    const token = localStorage.getItem("token");

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchStatus();
        return () => clearInterval(timer);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus(res.data.status || "NOT_CHECKED_IN");
            setWorkType(res.data.work_type || "OFFICE");
            if (res.data.status !== "NOT_CHECKED_IN") {
                setAttendanceData(res.data);
            } else {
                setAttendanceData(null);
            }
        } catch (error) {
            console.error("Error fetching status:", error);
        } finally {
            setLoading(false);
        }
    };

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }),
                    (error) => {
                        let msg = "Location permission is required for attendance.";
                        if (error.code === 1) msg = "Please allow location access to continue.";
                        if (error.code === 3) msg = "Location request timed out. Please try again.";
                        reject(new Error(msg));
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            }
        });
    };

    // ── Check In ─────────────────────────────────────────────────────────────
    const handleCheckIn = async () => {
        try {
            setLoading(true);
            let payload = {};

            if (workType === "WFH") {
                // Location required – validated against registered home address
                const location = await getLocation();
                payload = { location, work_mode: "WFH" };

            } else if (workType === "OFFICE") {
                // Location required – office geo-fence
                const location = await getLocation();
                payload = { location, work_mode: "OFFICE" };

            } else if (workType === "HYBRID") {
                if (hybridMode === "OFFICE") {
                    // Office geo-fence
                    const location = await getLocation();
                    payload = { location, work_mode: "OFFICE" };
                } else {
                    // WFH – home geo-fence
                    const location = await getLocation();
                    payload = { location, work_mode: "WFH" };
                }
            }

            await axios.post(`${API_URL}/check-in`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStatus();
        } catch (error) {
            alert(error.response?.data?.message || error.message || "Check-in failed");
        } finally {
            setLoading(false);
        }
    };

    // ── Check Out ─────────────────────────────────────────────────────────────
    const handleCheckOut = async () => {
        try {
            setLoading(true);
            // Both OFFICE and WFH check-outs now require location
            // (office geo-fence for OFFICE, home geo-fence for WFH)
            const location = await getLocation();
            await axios.post(`${API_URL}/check-out`, { location }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStatus();
        } catch (error) {
            alert(error.response?.data?.message || error.message || "Check-out failed");
        } finally {
            setLoading(false);
        }
    };

    // ── Label helpers ─────────────────────────────────────────────────────────
    const workTypeLabel = { OFFICE: "🏢 Office", HYBRID: "🔄 Hybrid", WFH: "🏠 WFH" };
    const workModeLabel = (m) => m === "WFH" ? "🏠 Work From Home" : "🏢 At Office";
    const workModeBadge = (m) => m === "WFH" ? "badge-wfh" : "badge-office";

    if (loading) return <div className="attendance-panel-loading">Loading Attendance...</div>;

    return (
        <div className="attendance-panel-card">
            <div className="panel-header">
                <h3><FaClock className="header-icon" /> Daily Attendance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="current-date">{currentTime.toDateString()}</span>
                    <span className="work-type-chip">{workTypeLabel[workType] || workType}</span>
                </div>
            </div>

            <div className="time-display">
                {currentTime.toLocaleTimeString()}
            </div>

            {/* Hybrid mode toggle — only shown before check-in */}
            {workType === "HYBRID" && status === "NOT_CHECKED_IN" && (
                <div className="hybrid-toggle">
                    <span className="hybrid-label">Today's mode:</span>
                    <button
                        className={`hybrid-btn ${hybridMode === "OFFICE" ? "active" : ""}`}
                        onClick={() => setHybridMode("OFFICE")}
                    >🏢 Office</button>
                    <button
                        className={`hybrid-btn ${hybridMode === "WFH" ? "active" : ""}`}
                        onClick={() => setHybridMode("WFH")}
                    >🏠 WFH</button>
                </div>
            )}

            <div className="status-info">
                {status === "NOT_CHECKED_IN" && (
                    <span className="status-badge gray">Not Logged In Today</span>
                )}
                {status === "CHECKED_IN" && (
                    <div className="active-status">
                        <span className="status-badge green">Currently Working</span>
                        <p className="check-time">Logged in at: {attendanceData?.check_in}</p>
                        {attendanceData?.work_mode && (
                            <span className={`mode-badge ${workModeBadge(attendanceData.work_mode)}`}>
                                {workModeLabel(attendanceData.work_mode)}
                            </span>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                            <p style={{ margin: 0 }}>Hours Today: <strong>{attendanceData?.daily_hours} hrs</strong></p>
                            <p style={{ margin: 0 }}>Hours this Week: <strong>{attendanceData?.weekly_hours} hrs</strong></p>
                        </div>
                    </div>
                )}
                {status === "CHECKED_OUT" && (
                    <div className="finished-status">
                        <span className="status-badge blue">Shift Completed</span>
                        <p className="check-time">Logged out at: {attendanceData?.check_out}</p>
                        {attendanceData?.work_mode && (
                            <span className={`mode-badge ${workModeBadge(attendanceData.work_mode)}`}>
                                {workModeLabel(attendanceData.work_mode)}
                            </span>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                            <p style={{ margin: 0 }}>Total Hours Today: <strong>{attendanceData?.daily_hours} hrs</strong></p>
                            <p style={{ margin: 0 }}>Total Hours this Week: <strong>{attendanceData?.weekly_hours} hrs</strong></p>
                        </div>
                    </div>
                )}
            </div>

            <div className="action-buttons">
                {status === "NOT_CHECKED_IN" && (
                    <button className="check-btn in" onClick={handleCheckIn}>
                        <FaSignInAlt /> Check In
                        {workType === "WFH" && (
                            <span style={{ fontSize: '10px', display: 'block', opacity: 0.8 }}>📍 Dynamic GPS Capture</span>
                        )}
                        {workType === "HYBRID" && hybridMode === "WFH" && (
                            <span style={{ fontSize: '10px', display: 'block', opacity: 0.8 }}>WFH – 📍 Dynamic GPS Capture</span>
                        )}
                    </button>
                )}
                {status === "CHECKED_IN" && (
                    <button className="check-btn out" onClick={handleCheckOut}>
                        <FaSignOutAlt /> Check Out
                        {attendanceData?.work_mode === "WFH" && (
                            <span style={{ fontSize: '10px', display: 'block', opacity: 0.8 }}>📍 Dynamic GPS Capture</span>
                        )}
                    </button>
                )}
                {status === "CHECKED_OUT" && (
                    <button className="check-btn disabled" disabled>
                        Attendance Recorded
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttendancePanel;
