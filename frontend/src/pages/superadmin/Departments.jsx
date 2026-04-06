import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import axios from "axios";
import "../../styles/tables.css";
import "../../styles/holidays.css";

const Department = () => {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    code: "",
  });

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      const res = await axios.get("http://localhost:5000/api/departments");
      setDepartments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= SEARCH ================= */
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= VIEW ================= */
  const handleViewClick = (department) => {
    setSelectedDepartment(department);
    setShowViewModal(true);
  };

  /* ================= EDIT ================= */
  const handleEditClick = (department) => {
    navigate(`/superadmin/edit-department/${department.id}`);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    const name = editForm.name?.trim();
    const code = editForm.code?.trim() || "";

    if (!name) {
      alert("Please fill required fields!");
      return;
    }
    if (!editForm.id) {
      alert("Invalid department selected for update.");
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/departments/${editForm.id}`,
        { name, code }
      );

      alert(res.data.message);
      setShowEditModal(false);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating department");
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/departments/${selectedDepartment.id}`
      );

      setShowDeleteModal(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="simple-container">
      <h2 className="page-title">Departments</h2>

      {/* Top Bar */}
      <div className="top-bar">

        <button
          className="small-btn"
          onClick={() => navigate("/superadmin/adddepartment")}
        >
          + Add New Department
        </button>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by name or code"
            className="search-input"
            value={searchTerm}
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
              <th>Department Code</th>
              <th>Department Name</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map((dept) => (
                <tr key={dept.id}>

                  <td>{dept.code}</td>
                  <td>{dept.name}</td>

                  <td>
                    <div className="action-buttons">

                      <button
                        className="icon-btn edit-btn"
                        onClick={() => handleViewClick(dept)}
                      >
                        <FaEye />
                      </button>

                      <button
                        className="icon-btn edit-btn"
                        onClick={() => handleEditClick(dept)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="icon-btn delete-btn"
                        onClick={() => handleDeleteClick(dept)}
                      >
                        <FaTrash />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No departments found</td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* VIEW MODAL */}
      {showViewModal && selectedDepartment && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Department Details</h3>

            <p><strong>ID:</strong> {selectedDepartment.id}</p>
            <p><strong>Code:</strong> {selectedDepartment.code}</p>
            <p><strong>Name:</strong> {selectedDepartment.name}</p>

            <div className="modal-buttons">
              <button
                className="no-btn"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Edit Department</h3>

            <form onSubmit={handleEditSave}>

              <div className="form-group">
                <label>
                  Department Name <span className="required">*</span>
                </label>

                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Department Code</label>

                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm({ ...editForm, code: e.target.value })
                  }
                />
              </div>

              <div className="modal-buttons">

                <button type="submit" className="yes-btn">
                  Update
                </button>

                <button
                  type="button"
                  className="no-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <p>Are you sure you want to delete this department?</p>

            <div className="modal-buttons">

              <button className="yes-btn" onClick={confirmDelete}>
                Yes
              </button>

              <button
                className="no-btn"
                onClick={() => setShowDeleteModal(false)}
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

export default Department;
