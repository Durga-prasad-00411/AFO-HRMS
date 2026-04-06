import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/holidays.css";
import Toast from "../../components/Toast";

const AddAsset = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [price, setPrice] = useState("");

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (isEditMode) {
      const token = localStorage.getItem("token");
      fetch(`http://localhost:5000/api/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
            setAssetName(data.asset_name || "");
            setAssetType(data.asset_type || "");
            setLocation(data.location || "");
            setDescription(data.description || "");
            setAccountNumber(data.account_number || "");
            // Format date for datetime-local
            if (data.purchase_date) {
                const date = new Date(data.purchase_date);
                const formattedDate = date.toISOString().slice(0, 16);
                setPurchaseDate(formattedDate);
            }
            setPrice(data.price || "");
            if (data.image) {
                setImagePreview(`http://localhost:5000/uploads/${data.image}`);
            }
        })
        .catch(err => console.error(err));
    }
  }, [id, isEditMode]);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!isEditMode && !imageFile) newErrors.image = true;
    if (!assetName) newErrors.assetName = true;
    if (!assetType) newErrors.assetType = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ 
        open: true, 
        message: "Please fill all required fields highlighted in red.", 
        severity: "error" 
      });
      return;
    }

    try {
      const formData = new FormData();

      if (imageFile) {
        formData.append("assetImage", imageFile);
      }
      formData.append("assetName", assetName);
      formData.append("assetType", assetType);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("accountNumber", accountNumber);
      formData.append("purchaseDate", purchaseDate);
      formData.append("price", price);

      const url = isEditMode
        ? `http://localhost:5000/api/assets/update/${id}`
        : "http://localhost:5000/api/assets";
      const method = isEditMode ? "PUT" : "POST";

      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

      if (method === "PUT") {
          await axios.put(url, formData, { headers });
      } else {
          await axios.post(url, formData, { headers });
      }

      setToast({ 
        open: true, 
        message: isEditMode ? "Asset Updated Successfully! ✅" : "Asset Added Successfully! ✅", 
        severity: "success" 
      });
      
      setTimeout(() => navigate("/superadmin/asset"), 1500);

    } catch (error) {
      setToast({ 
        open: true, 
        message: error.response?.data?.message || "Failed to save asset", 
        severity: "error" 
      });
    }
  };

  return (
    <div className={`holiday-card ${Object.keys(errors).length > 0 ? "error-card" : ""}`}>
      <div className="holiday-content">

        <h2>{isEditMode ? "Edit Asset" : "Add Asset"}</h2>

        <form onSubmit={handleSubmit}>

          {/* Upload Section (ONLY width reduced) */}
          <div className="form-group" style={{ maxWidth: "220px" }}>
            <label>
              Asset Image <span className="required">*</span>
            </label>

            <div
              className={errors.image ? "error-field" : ""}
              style={{
                border: "2px dashed #ccc",
                height: "110px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginTop: "6px",
                backgroundColor: errors.image ? "#fef2f2" : "transparent"
              }}
              onClick={handleUploadClick}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Asset"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "12px"
                  }}
                />
              ) : (
                <span style={{ color: errors.image ? "#ef4444" : "#64748b", fontWeight: 600 }}>Click to Upload</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* Asset Details (UNCHANGED) */}
          <div className="row">
            <div className="form-group">
              <label className={errors.assetName ? "error-label" : ""}>
                Asset Name <span className="required">*</span>
              </label>
              <input
                className={errors.assetName ? "error-field" : ""}
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                type="text"
              />
            </div>

            <div className="form-group">
              <label className={errors.assetType ? "error-label" : ""}>
                Asset Type <span className="required">*</span>
              </label>
              <select
                className={errors.assetType ? "error-field" : ""}
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
              >
                <option value="">Select Asset Type</option>
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Mobile">Mobile</option>
                <option value="Vehicle">Vehicle</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              type="text"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <h3 style={{ marginTop: "20px" }}>Transaction Details</h3>

          <div className="row">
            <div className="form-group">
              <label>Account Number</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                type="text"
              />
            </div>

            <div className="form-group">
              <label>Purchase Date</label>
              <input
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                type="datetime-local"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
            />
          </div>

          {/* Buttons */}
          <div className="button-bar">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/superadmin/asset")}
            >
              Cancel
            </button>

            <button type="submit" className="btn-add">
              {isEditMode ? "Update" : "Create"}
            </button>
          </div>

        </form>
      </div>

      <Toast 
        open={toast.open} 
        message={toast.message} 
        severity={toast.severity} 
        handleClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default AddAsset;