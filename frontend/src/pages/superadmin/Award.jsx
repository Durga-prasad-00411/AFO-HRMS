import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEye, FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/tables.css";

const Awards = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAward, setSelectedAward] = useState(null);
  const [editForm, setEditForm] = useState({
    id: "",
    award_title: "",
    award_type: "",
    description: "",
    image: null
  });

  const [awards, setAwards] = useState([]);

  const fetchAwards = () => {
    fetch("http://localhost:5000/api/awards", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAwards(data);
        } else {
          setAwards([]);
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setAwards([]);
      });
  };

  useEffect(() => {
    fetchAwards();
  }, []);

  useEffect(() => {
    if (showViewModal || showEditModal || showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showViewModal, showEditModal, showDeleteModal]);

  /* ================= SEARCH FILTER ================= */

  const filteredAwards = awards.filter((award) =>
    award.award_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= VIEW ================= */

  const handleView = (award) => {
    setSelectedAward(award);
    setShowViewModal(true);
  };

  /* ================= EDIT ================= */

  const handleEdit = (award) => {
    navigate(`/superadmin/edit-award/${award.id}`);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("awardTitle", editForm.award_title);
    formData.append("awardType", editForm.award_type);
    formData.append("description", editForm.description);

    if (editForm.image) {
      formData.append("typeFile", editForm.image);
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/awards/update/${editForm.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Award updated successfully");
        setShowEditModal(false);
        fetchAwards();
      } else {
        alert(data.message || "Error updating award");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating award");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = (award) => {
    setSelectedAward(award);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/awards/${selectedAward.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        fetchAwards();
        setShowDeleteModal(false);
        alert("Award deleted successfully");
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= RENDER ================= */

  const getAwardTypeClass = (title) => {
    const t = title?.toLowerCase() || "";
    if (t.includes("achievement")) return "type-achievement";
    if (t.includes("excellence")) return "type-excellence";
    if (t.includes("service")) return "type-service";
    return "type-default";
  };

  return (
    <div className="simple-container theme-violet">
      <h2 className="page-title">Award</h2>

      {/* ================= TOP BAR ================= */}

      <div className="top-bar">
        <button
          className="small-btn"
          onClick={() => navigate("/superadmin/addaward")}
        >
          + Add New Award
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

      {/* ================= TABLE ================= */}

      <div className="table-wrapper">
        <table className="leave-table">
          <thead>
            <tr>
              <th>Award Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAwards.map((award) => (
              <tr key={award.id}>
                <td>{award.award_title}</td>
                <td className={getAwardTypeClass(award.award_type)}>{award.award_type}</td>

                <td>
                  <button 
                    className={`status-pill ${award.status?.toLowerCase() === "inactive" ? "inactive" : "active"}`}
                    style={{ border: 'none', cursor: 'pointer' }}
                    onClick={() => {/* To be implemented */}}
                  >
                    {award.status || "Active"}
                  </button>
                </td>

                <td>
                  <div className="action-buttons">
                    <button
                      className="icon-btn view-btn"
                      onClick={() => handleView(award)}
                    >
                      <FaEye />
                    </button>

                    <button
                      className="icon-btn edit-btn"
                      onClick={() => handleEdit(award)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="icon-btn delete-btn"
                      onClick={() => handleDelete(award)}
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

      {/* ================= VIEW MODAL ================= */}

      {showViewModal && selectedAward && (
        <div className="modal-overlay">
          <div className="modal-box large-modal">
            <h3>Award Details</h3>

            <div className="view-details-grid">
              <div className="view-detail-item">
                <label>Award Title:</label>
                <p>{selectedAward.award_title}</p>
              </div>

              <div className="view-detail-item">
                <label>Type:</label>
                <p>{selectedAward.award_type}</p>
              </div>

              <div className="view-detail-item">
                <label>Status:</label>
                <p>Active</p>
              </div>

              <div className="view-detail-item">
                <label>Type Description:</label>
                <p>{selectedAward.description}</p>
              </div>

              <div className="view-detail-item">
                <label>File / Image:</label>

                {selectedAward.file_path ? (
                  <img
                    src={`http://localhost:5000${selectedAward.file_path}`}
                    alt="award"
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                    }}
                  />
                ) : (
                  <p>No File Uploaded</p>
                )}
              </div>
            </div>

            <button
              className="small-btn"
              style={{ marginTop: "15px" }}
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box large-modal">
            <h3>Edit Award</h3>
            <form onSubmit={handleEditSave} style={{ textAlign: "left" }}>
              <div className="view-details-grid">
                <div className="view-detail-item">
                  <label>Award Title</label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={editForm.award_title}
                    onChange={(e) => setEditForm({ ...editForm, award_title: e.target.value })}
                    required
                  />
                </div>
                <div className="view-detail-item">
                  <label>Award Type</label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={editForm.award_type}
                    onChange={(e) => setEditForm({ ...editForm, award_type: e.target.value })}
                    required
                  />
                </div>
                <div className="view-detail-item">
                  <label>Update File (Optional)</label>
                  <input
                    type="file"
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.files[0] })}
                  />
                </div>
                <div className="view-detail-item" style={{ gridColumn: "span 2" }}>
                  <label>Description</label>
                  <textarea
                    className="search-input"
                    style={{ width: "100%", height: "80px", padding: "8px" }}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    required
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

      {/* ================= DELETE MODAL ================= */}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Are you sure you want to delete this award?</p>
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

export default Awards;