import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEye, FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/tables.css";

const AppreciationList = () => {
    const navigate = useNavigate();

    const [appreciations, setAppreciations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [awardTitles, setAwardTitles] = useState([]);
    const [awardTypes, setAwardTypes] = useState([]);

    const [editForm, setEditForm] = useState({
        id: "",
        employee_name: "",
        employee_id: "",
        award_title: "",
        award_type: "",
        award_date: "",
        award_period: "",
        given_by: "",
        description: ""
    });

    const fetchAppreciations = () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:5000/api/appreciations", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAppreciations(data);
                } else {
                    setAppreciations([]);
                }
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setAppreciations([]);
            });
    };

    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/awards", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                const uniqueTitles = [...new Set(data.map(a => a.award_title))].filter(Boolean);
                const uniqueTypes = [...new Set(data.map(a => a.award_type))].filter(Boolean);
                setAwardTitles(uniqueTitles.map((t, i) => ({ id: i, name: t })));
                setAwardTypes(uniqueTypes.map((t, i) => ({ id: i, name: t })));
            }
        } catch (error) {
            console.error("Error fetching dropdown data", error);
        }
    };

    useEffect(() => {
        fetchAppreciations();
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (selectedItem || showEditModal || deleteId) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [selectedItem, showEditModal, deleteId]);

    const handleView = (item) => {
        setSelectedItem(item);
    };

    const handleEdit = (item) => {
        navigate(`/superadmin/edit-appreciation/${item.id}`);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/appreciations/update/${editForm.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeName: editForm.employee_name,
                        employeeId: editForm.employee_id,
                        awardTitle: editForm.award_title,
                        awardDate: editForm.award_date,
                        awardType: editForm.award_type,
                        awardPeriod: editForm.award_period,
                        givenBy: editForm.given_by,
                        description: editForm.description
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Appreciation updated successfully");
                setShowEditModal(false);
                fetchAppreciations();
            } else {
                alert(data.message || "Error updating appreciation");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating appreciation");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:5000/api/appreciations/${deleteId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.ok) {
                setAppreciations(appreciations.filter((item) => item.id !== deleteId));
                setDeleteId(null);
                alert("Deleted successfully");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getAwardTypeClass = (title) => {
        const t = title?.toLowerCase() || "";
        if (t.includes("achievement")) return "type-achievement";
        if (t.includes("excellence")) return "type-excellence";
        if (t.includes("service")) return "type-service";
        return "type-default";
    };

    const filteredData = Array.isArray(appreciations)
        ? appreciations.filter((item) =>
            item.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    return (
        <div className="simple-container theme-violet">
            <h2 className="page-title">Appreciations</h2>

            <div className="top-bar">
                <button
                    className="small-btn"
                    onClick={() => navigate("/superadmin/addappreciation")}
                >
                    + Add Appreciation
                </button>

                <div className="search-wrapper">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="search-icon" />
                </div>
            </div>

            <div className="table-wrapper">
                <table className="leave-table">
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            <th>Employee ID</th>
                            <th>Award Title</th>
                            <th>Award Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item) => (
                            <tr key={item.id}>
                                <td>{item.employee_name}</td>
                                <td>{item.employee_id}</td>
                                <td className={getAwardTypeClass(item.award_title)}>{item.award_title}</td>
                                <td>{item.award_date}</td>
                                <td className="status-cell">
                                    <button 
                                        className={`status-pill ${item.status?.toLowerCase() === "inactive" ? "inactive" : "active"}`}
                                        style={{ border: 'none', cursor: 'pointer' }}
                                        onClick={() => {/* To be implemented */}}
                                    >
                                        {item.status || "Active"}
                                    </button>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="icon-btn view-btn"
                                            onClick={() => handleView(item)}
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className="icon-btn edit-btn"
                                            onClick={() => handleEdit(item)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="icon-btn delete-btn"
                                            onClick={() => handleDeleteClick(item.id)}
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

            {selectedItem && (
                <div className="modal-overlay">
                    <div className="modal-box large-modal">
                        <h3>Appreciation Details</h3>
                        <div className="view-details-grid">
                            <div className="view-detail-item">
                                <label>Employee Name</label>
                                <p>{selectedItem.employee_name}</p>
                            </div>
                            <div className="view-detail-item">
                                <label>Employee ID</label>
                                <p>{selectedItem.employee_id}</p>
                            </div>
                            <div className="view-detail-item">
                                <label>Award Title</label>
                                <p>{selectedItem.award_title}</p>
                            </div>
                            <div className="view-detail-item">
                                <label>Award Date</label>
                                <p>{selectedItem.award_date}</p>
                            </div>
                            <div className="view-detail-item">
                                <label>Award Type</label>
                                <p>{selectedItem.award_type}</p>
                            </div>
                            <div className="view-detail-item">
                                <label>Award Period</label>
                                <p>{selectedItem.award_period}</p>
                            </div>
                            <div className="view-detail-item">
                                <label>Given By</label>
                                <p>{selectedItem.given_by}</p>
                            </div>
                            <div className="view-detail-item">
                                <label>Award Description</label>
                                <p>{selectedItem.description}</p>
                            </div>
                        </div>
                        <div className="modal-buttons">
                            <button className="no-btn" onClick={() => setSelectedItem(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-box large-modal">
                        <h3>Edit Appreciation</h3>
                        <form onSubmit={handleEditSave} style={{ textAlign: "left" }}>
                            <div className="view-details-grid">
                                <div className="view-detail-item">
                                    <label>Employee Name</label>
                                    <input
                                        type="text"
                                        className="search-input"
                                        style={{ width: "100%" }}
                                        value={editForm.employee_name}
                                        onChange={(e) => setEditForm({ ...editForm, employee_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="view-detail-item">
                                    <label>Employee ID</label>
                                    <input
                                        type="text"
                                        className="search-input"
                                        style={{ width: "100%" }}
                                        value={editForm.employee_id}
                                        onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="view-detail-item">
                                    <label>Award Title</label>
                                    <select
                                        className="search-input"
                                        style={{ width: "100%" }}
                                        value={editForm.award_title}
                                        onChange={(e) => setEditForm({ ...editForm, award_title: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Award</option>
                                        {awardTitles.map((title) => (
                                            <option key={title.id} value={title.name}>{title.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="view-detail-item">
                                    <label>Award Type</label>
                                    <select
                                        className="search-input"
                                        style={{ width: "100%" }}
                                        value={editForm.award_type}
                                        onChange={(e) => setEditForm({ ...editForm, award_type: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        {awardTypes.map((type) => (
                                            <option key={type.id} value={type.name}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="view-detail-item">
                                    <label>Award Date</label>
                                    <input
                                        type="date"
                                        className="search-input"
                                        style={{ width: "100%" }}
                                        value={editForm.award_date}
                                        onChange={(e) => setEditForm({ ...editForm, award_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="view-detail-item">
                                    <label>Award Period</label>
                                    <input
                                        type="text"
                                        className="search-input"
                                        style={{ width: "100%" }}
                                        value={editForm.award_period}
                                        onChange={(e) => setEditForm({ ...editForm, award_period: e.target.value })}
                                    />
                                </div>
                                <div className="view-detail-item">
                                    <label>Given By</label>
                                    <input
                                        type="text"
                                        className="search-input"
                                        style={{ width: "100%" }}
                                        value={editForm.given_by}
                                        onChange={(e) => setEditForm({ ...editForm, given_by: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="view-detail-item" style={{ gridColumn: "span 2" }}>
                                    <label>Description</label>
                                    <textarea
                                        className="search-input"
                                        style={{ width: "100%", height: "60px", padding: "8px" }}
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-buttons" style={{ marginTop: "20px" }}>
                                <button type="submit" className="yes-btn">Save</button>
                                <button type="button" className="no-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <p>Are you sure you want to delete?</p>
                        <div className="modal-buttons">
                            <button className="yes-btn" onClick={confirmDelete}>Yes</button>
                            <button className="no-btn" onClick={() => setDeleteId(null)}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppreciationList;