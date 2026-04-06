import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/holidays.css";

const AddAward = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [awardTitle, setAwardTitle] = useState("");
  const [awardType, setAwardType] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeFile, setTypeFile] = useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const token = localStorage.getItem("token");
      fetch(`http://localhost:5000/api/awards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
            setAwardTitle(data.award_title || "");
            setAwardType(data.award_type || "");
            setTypeDescription(data.description || "");
        })
        .catch(err => console.error(err));
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const sendData = new FormData();
    sendData.append("awardTitle", awardTitle);
    sendData.append("awardType", awardType);
    sendData.append("description", typeDescription);

    if (typeFile) {
      sendData.append("typeFile", typeFile);
    }

    try {
      const url = isEditMode
        ? `http://localhost:5000/api/awards/update/${id}`
        : "http://localhost:5000/api/awards/add";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(
        url,
        {
          method: method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: sendData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message);
        return;
      }

      setIsError(false);
      setMessage(data.message);
      alert(data.message);
      navigate("/superadmin/award");

    } catch (error) {
      setIsError(true);
      setMessage("Server error");
    }
  };

  return (
    <div className="holiday-card">
      <div className="holiday-content">
        <h2>{isEditMode ? "Edit Award" : "Add Award"}</h2>

        {message && (
          <div className={isError ? "form-error" : "form-success"} style={{ marginBottom: "1rem", color: isError ? "red" : "green", fontWeight: "bold" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">

          {/* Award Title */}
          <div className="form-group">
            <label>
              Award Title <span className="required">*</span>
            </label>
            <input
              type="text"
              name="awardTitle"
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              placeholder="Enter Award Title"
              required
            />
          </div>

          {/* Award Type - TEXT INPUT ONLY */}
          <div className="form-group">
            <label>
              Award Type <span className="required">*</span>
            </label>
            <input
              type="text"
              value={awardType}
              onChange={(e) => setAwardType(e.target.value)}
              placeholder="Enter Award Type"
              required
            />
          </div>

          {/* Type Description - ALWAYS VISIBLE */}
          <div className="form-group">
            <label>
              Award Description <span className="required">*</span>
            </label>
            <input
              type="text"
              value={typeDescription}
              onChange={(e) => setTypeDescription(e.target.value)}
              placeholder="Enter Description"
              required
            />
          </div>

          {/* File Upload - ALWAYS VISIBLE */}
          <div className="form-group">
            <label>Upload File (Optional)</label>
            <input
              type="file"
              onChange={(e) => setTypeFile(e.target.files[0])}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            />
          </div>

          {/* Buttons */}
          <div className="button-bar">
            <button type="submit" className="btn-add">
              {isEditMode ? "Update" : "Save"}
            </button>

            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/superadmin/award")}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddAward;