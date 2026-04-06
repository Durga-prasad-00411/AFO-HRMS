import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import axios from "axios";
import "../../styles/tables.css";

const CompanyPolicies = () => {
  const navigate = useNavigate();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  /* ===========================
     FETCH ALL POLICIES
  =========================== */
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/policies");
      console.log("API DATA", response.data);
      setPolicies(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleEditClick = (policy) => {
    navigate(`/superadmin/edit-policy/${policy.id}`, {
      state: { policy },
    });
  };

  /* ===========================
     DELETE POLICY
  =========================== */
  const handleDeleteClick = (policy) => {
    setSelectedPolicy(policy);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/policies/${selectedPolicy.id}`
      );
      setShowDeleteModal(false);
      fetchPolicies();
    } catch (err) {
      alert("Delete failed");
    }
  };

  /* ===========================
     VIEW POLICY DETAILS
  =========================== */
  const handleViewClick = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/policies/${id}`
      );
      setSelectedPolicy(response.data);
      setShowViewModal(true);
    } catch (err) {
      alert("Failed to load policy details");
    }
  };

  /* ===========================
     SEARCH FILTER
  =========================== */
  const filteredPolicies = policies.filter((policy) =>
    policy.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="simple-container">
      <h2 className="page-title">Company Policies</h2>

      {/* Top Bar */}
      <div className="top-bar">
        <button
          className="small-btn"
          onClick={() => navigate("/superadmin/addpolicy")}
        >
          + Add New Policy
        </button>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by policy title"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      {/* Loading & Error */}
      {loading && <p>Loading policies...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Table */}
      {!loading && (
        <div className="table-wrapper">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Policy Title</th>
                <th>Applicable To</th>
                <th>Start Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id}>
                    <td>{policy.title}</td>
                    <td>{policy.applicable_to}</td>
                    <td>{policy.start_date}</td>
                    <td>  
                      <span
                        className={
                          policy.status === "Active"
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {policy.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* View */}
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => handleViewClick(policy.id)}
                        >
                          <FaEye />
                        </button>

                        {/* Edit */}
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => handleEditClick(policy)}
                        >
                          <FaEdit />
                        </button>

                        {/* Delete */}
                        <button
                          className="icon-btn delete-btn"
                          onClick={() => handleDeleteClick(policy)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No policies found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPolicy && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Policy Details</h3>
            <p><strong>Title:</strong> {selectedPolicy.title}</p>
            <p><strong>ApplicableTo:</strong> {selectedPolicy.applicable_to}</p>
            <p><strong>StartDate:</strong> {selectedPolicy.start_date}</p>
            <p><strong>Status:</strong> {selectedPolicy.status}</p>
            <p><strong>Description:</strong> {selectedPolicy.description}</p>

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
            <p>Are you sure you want to delete this policy?</p>
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

export default CompanyPolicies;