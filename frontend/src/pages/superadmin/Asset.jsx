import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEye, FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/tables.css";

const Assets = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    assetName: "",
    assetType: "",
    location: "",
    description: "",
    accountNumber: "",
    purchaseDate: "",
    price: "",
    image: null,
  });
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [assets, setAssets] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem("token");

  /* ================= FETCH ASSETS ================= */

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      const response = await fetch("http://localhost:5000/api/assets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAssets(Array.isArray(data) ? data : data.data || []);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  /* ================= SEARCH ================= */

  const filteredAssets = assets.filter((asset) =>
    asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= DELETE ================= */

  const handleDelete = (asset) => {
    setSelectedAsset(asset);
    setDeleteId(asset.id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/assets/delete/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Asset deleted successfully");
      fetchAssets();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /* ================= RETURN ================= */

  const handleReturn = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/assets/return/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Asset returned successfully");
      fetchAssets();
    } catch (error) {
      console.error(error);
    }
  };

  /* ================= VIEW ================= */

  const handleView = (asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);
  };

  const handleEditClick = (asset) => {
    navigate(`/superadmin/edit-asset/${asset.id}`);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    if (
      !editForm.assetName ||
      !editForm.assetType ||
      !editForm.location ||
      !editForm.accountNumber ||
      !editForm.purchaseDate ||
      !editForm.price
    ) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("assetName", editForm.assetName);
      formData.append("assetType", editForm.assetType);
      formData.append("location", editForm.location);
      formData.append("description", editForm.description);
      formData.append("accountNumber", editForm.accountNumber);
      formData.append("purchaseDate", editForm.purchaseDate);
      formData.append("price", editForm.price);
      if (editForm.image) {
        formData.append("assetImage", editForm.image);
      }

      const response = await fetch(
        `http://localhost:5000/api/assets/update/${editForm.id}`,
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
        alert(data.message || "Asset updated successfully");
        setShowEditModal(false);
        fetchAssets();
      } else {
        alert(data.message || "Error updating asset");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating asset");
    }
  };

  /* ================= IMAGE VIEW ================= */

  const handleImageView = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  return (
    <div className="simple-container theme-cyan">
      <h2 className="page-title">Assets</h2>

      {/* TOP BAR */}

      <div className="top-bar">
        <button
          className="small-btn"
          onClick={() => navigate("/superadmin/add-asset")}
        >
          + Add New Asset
        </button>

        <button
          className="small-btn"
          style={{ marginLeft: "10px" }}
          onClick={() => navigate("/superadmin/allocate-asset")}
        >
          + Allocate Asset
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

      {/* TABLE */}

      <div className="table-wrapper">
        <table className="leave-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Image</th>
              <th>Allocated To</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No assets found
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.asset_name}</td>

                  <td>{asset.asset_type}</td>

                  <td>
                    {asset.image ? (
                      <button
                        className="icon-btn view-btn"
                        onClick={() =>
                          handleImageView(
                            `http://localhost:5000/uploads/${asset.image}`
                          )
                        }
                      >
                        <FaEye />
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* FIXED FIELD */}
                  <td>{asset.allocatedTo || "-"}</td>

                  <td>{asset.location}</td>

                  <td
                    className={
                      asset.status === "Working"
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {asset.status || "Available"}
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="icon-btn view-btn"
                        onClick={() => handleView(asset)}
                      >
                        <FaEye />
                      </button>

                      <button
                        className="icon-btn"
                        onClick={() => handleEditClick(asset)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="icon-btn delete-btn"
                        onClick={() => handleDelete(asset)}
                      >
                        <FaTrash />
                      </button>

                      {!asset.allocatedTo ? (
                        <button
                          className="small-btn"
                          onClick={() =>
                            navigate("/superadmin/allocate-asset", { state: { selectedAsset: asset } })
                          }
                        >
                          Lend to
                        </button>
                      ) : (
                        <button
                          className="small-btn"
                          onClick={() => handleReturn(asset.id)}
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}

      {showAssetModal && selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-box large-modal">
            <h3>Asset Details</h3>

            <div className="view-details-grid">
              <div className="view-detail-item">
                <label>Employee Name:</label>
                <p>{selectedAsset.allocatedTo || "-"}</p>
              </div>

              <div className="view-detail-item">
                <label>Name:</label>
                <p>{selectedAsset.asset_name}</p>
              </div>

              <div className="view-detail-item">
                <label>Type:</label>
                <p>{selectedAsset.asset_type}</p>
              </div>

              <div className="view-detail-item">
                <label>Location:</label>
                <p>{selectedAsset.location}</p>
              </div>

              <div className="view-detail-item">
                <label>Status:</label>
                <p>{selectedAsset.status || "Available"}</p>
              </div>
            </div>

            <button
              className="small-btn"
              style={{ marginTop: "15px" }}
              onClick={() => setShowAssetModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}

      {showImageModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Asset Image</h3>

            <img
              src={selectedImage}
              alt="Asset"
              style={{
                width: "100%",
                borderRadius: "6px",
                marginTop: "10px",
              }}
            />

            <div className="modal-buttons">
              <button
                className="yes-btn"
                onClick={() => setShowImageModal(false)}
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
          <div className="modal-box large-modal" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Edit Asset</h3>

            <form onSubmit={handleEditSave}>
              <div className="form-group">
                <label>Asset Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={editForm.assetName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assetName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Asset Type <span className="required">*</span></label>
                <select
                  value={editForm.assetType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assetType: e.target.value })
                  }
                  required
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Vehicle">Vehicle</option>
                </select>
              </div>

              <div className="form-group">
                <label>Asset Location <span className="required">*</span></label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Number <span className="required">*</span></label>
                <input
                  type="text"
                  value={editForm.accountNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, accountNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Purchase Date <span className="required">*</span></label>
                <input
                  type="date"
                  value={editForm.purchaseDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, purchaseDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Price <span className="required">*</span></label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Update Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditForm({ ...editForm, image: e.target.files[0] })
                  }
                />
              </div>

              <div className="modal-buttons" style={{ marginTop: "15px" }}>
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
            <p>Are you sure you want to delete this asset?</p>

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

export default Assets;