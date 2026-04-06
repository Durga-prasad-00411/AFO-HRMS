import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import axios from "axios";
import "../../styles/tables.css";

const Designation = () => {
  const navigate = useNavigate();

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/designations"
      );

      console.log("API Response:", res.data); // 🔥 Debug

      // Safe fallback
      setDesignations(res.data?.data || []);

      setError("");
    } catch (error) {
      console.error("Fetch Error:", error);
      setError("Failed to fetch designations");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (designation) => {
    setSelectedDesignation(designation);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/designations/${selectedDesignation.id}`
      );

      setShowDeleteModal(false);
      fetchDesignations();
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  /* ================= VIEW ================= */
  const handleViewClick = (designation) => {
    setSelectedDesignation(designation);
    setShowViewModal(true);
  };

  /* ================= SEARCH ================= */
  const filteredDesignations = designations.filter(
    (des) =>
      des.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      des.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="simple-container">
      <h2 className="page-title">Designations</h2>

      {/* Top Bar */}
      <div className="top-bar">
        <button
          className="small-btn"
          onClick={() => navigate("/superadmin/adddesignation")}
        >
          + Add New Designation
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

      {loading && <p>Loading designations...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Table */}
      {!loading && (
        <div className="table-wrapper">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Designation Code</th>
                <th>Designation Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDesignations.length > 0 ? (
                filteredDesignations.map((des) => (
                  <tr key={des.id}>
                    <td>{des.code}</td>
                    <td>{des.name}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => handleViewClick(des)}
                        >
                          <FaEye />
                        </button>

                        <button
                          className="icon-btn edit-btn"
                          onClick={() =>
                            navigate(`/superadmin/edit-designation/${des.id}`)
                          }
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="icon-btn delete-btn"
                          onClick={() => handleDeleteClick(des)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No designations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDesignation && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Designation Details</h3>
            <p><strong>ID:</strong> {selectedDesignation.id}</p>
            <p><strong>Code:</strong> {selectedDesignation.code}</p>
            <p><strong>Name:</strong> {selectedDesignation.name}</p>

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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Are you sure you want to delete this designation?</p>
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

export default Designation;