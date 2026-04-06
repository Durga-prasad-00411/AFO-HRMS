import React, { useState } from "react";
import { FaSearch, FaEye, FaTrash, FaEdit, FaArrowLeft, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../styles/tables.css";

const Shifts = () => {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [viewItem, setViewItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/shifts", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setShifts(data);
            }
        } catch (err) {
            console.error("Fetch shifts error:", err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchShifts();
    }, []);

    /* Search */
    const filteredShifts = shifts.filter((shift) =>
        (shift.shift_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* Delete */
    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/shifts/${deleteItem.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchShifts();
            } else {
                alert(data.message || "Failed to delete");
            }
        } catch (err) {
            console.error("Delete shift error:", err);
            alert("Network error");
        } finally {
            setDeleteItem(null);
        }
    };

    return (
        <div className="simple-container theme-indigo">
            <h2 className="page-title">Shifts</h2>

            {/* Top Bar */}
            <div className="top-bar">
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        className="small-btn"
                        onClick={() => navigate("/superadmin")}
                        style={{ backgroundColor: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FaArrowLeft /> Dashboard
                    </button>
                    <button
                        className="small-btn"
                        onClick={() => navigate("/superadmin/addshift")}
                    >
                        + Add New Shift
                    </button>
                </div>

                <div className="search-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="search-icon" />
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="leave-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Late Mark After</th>
                            <th>Allow Clock Out Till</th>
                            <th>Early Clock In</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredShifts.map((shift) => (
                            <tr key={shift.id}>
                                <td>{shift.shift_name}</td>
                                <td>{shift.clock_in}</td>
                                <td>{shift.clock_out}</td>
                                <td>{shift.late_mark_after} min</td>
                                <td>{shift.allow_clock_out}</td>
                                <td>{shift.early_clock_in}</td>
                                <td>
                                    <div className="action-buttons">

                                        {/* View */}
                                        <button
                                            className="icon-btn view-btn"
                                            onClick={() => setViewItem(shift)}
                                        >
                                            <FaEye />
                                        </button>

                                        {/* Edit */}
                                        <button
                                            className="icon-btn edit-btn"
                                            onClick={() =>
                                                navigate(`/superadmin/edit-shift/${shift.id}`)
                                            }
                                        >
                                            <FaEdit />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            className="icon-btn delete-btn"
                                            onClick={() => setDeleteItem(shift)}
                                        >
                                            <FaTrash />
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            {viewItem && (
                <div className="modal-overlay">
                    <div className="modal-box large-modal" style={{ position: 'relative', minWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0 }}>Shift Details</h3>
                            <button
                                className="yes-btn"
                                onClick={() => setViewItem(null)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 15px', fontSize: '12px' }}
                            >
                                <FaArrowLeft /> Back to List
                            </button>
                        </div>

                        <div className="view-details-grid">
                            <div className="view-detail-item">
                                <label>Name</label>
                                <p>{viewItem.shift_name}</p>
                            </div>

                            <div className="view-detail-item">
                                <label>Clock In</label>
                                <p>{viewItem.clock_in}</p>
                            </div>

                            <div className="view-detail-item">
                                <label>Clock Out</label>
                                <p>{viewItem.clock_out}</p>
                            </div>

                            <div className="view-detail-item">
                                <label>Late Mark After</label>
                                <p>{viewItem.late_mark_after} minutes</p>
                            </div>

                            <div className="view-detail-item">
                                <label>Allow Clock Out Till</label>
                                <p>{viewItem.allow_clock_out}</p>
                            </div>

                            <div className="view-detail-item">
                                <label>Early Clock In</label>
                                <p>{viewItem.early_clock_in}</p>
                            </div>

                            <div className="view-detail-item">
                                <label>Total Employees</label>
                                <p>{viewItem.totalEmployees || 0}</p>
                            </div>
                        </div>

                        <div className="modal-buttons" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                            <button
                                className="no-btn"
                                onClick={() => setViewItem(null)}
                                style={{ padding: '10px 30px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteItem && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <p>Are you sure you want to delete this shift?</p>

                        <div className="modal-buttons">
                            <button className="yes-btn" onClick={confirmDelete}>
                                Yes
                            </button>

                            <button
                                className="no-btn"
                                onClick={() => setDeleteItem(null)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Shifts;