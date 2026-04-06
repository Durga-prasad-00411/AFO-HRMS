import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/forms.css";
import Toast from "../../components/Toast";

const AddHoliday = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    holiday_date: "",
    holiday_type: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (isEditMode) {
      axios.get(`http://localhost:5000/api/holidays/${id}`)
        .then(res => {
          const h = res.data;
          setFormData({
            title: h.title || "",
            holiday_date: h.holiday_date ? h.holiday_date.split("T")[0] : "",
            holiday_type: h.holiday_type || "",
            description: h.description || "",
          });
        })
        .catch(err => console.error(err));
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!formData.title) newErrors.title = true;
    if (!formData.holiday_date) newErrors.holiday_date = true;
    if (!formData.holiday_type) newErrors.holiday_type = true;

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
      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/holidays/${id}`, formData);
        setToast({ open: true, message: "Holiday Updated Successfully! ✅", severity: "success" });
      } else {
        await axios.post("http://localhost:5000/api/holidays", formData);
        setToast({ open: true, message: "Holiday Added Successfully! ✅", severity: "success" });
      }

      setTimeout(() => navigate("/superadmin/holidays"), 1500);

    } catch (error) {
      setToast({ 
        open: true, 
        message: error.response?.data?.message || "Failed to save holiday", 
        severity: "error" 
      });
    }
  };

  return (
    <div className="holiday-container">
      <div className={`holiday-card ${Object.keys(errors).length > 0 ? "error-card" : ""}`}>
        <h2>{isEditMode ? "Edit Holiday" : "Add Holiday"}</h2>

        <form onSubmit={handleSubmit}>
          
          <div className="row">
            <div className="form-group">
              <label className={errors.title ? "error-label" : ""}>Holiday Name</label>
              <input
                type="text"
                name="title"
                className={errors.title ? "error-field" : ""}
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className={errors.holiday_date ? "error-label" : ""}>Date</label>
              <input
                type="date"
                name="holiday_date"
                className={errors.holiday_date ? "error-field" : ""}
                value={formData.holiday_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className={errors.holiday_type ? "error-label" : ""}>Day Type</label>
            <select
              name="holiday_type"
              className={errors.holiday_type ? "error-field" : ""}
              value={formData.holiday_type}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="FULL_DAY">Full Day</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description / Notes</label>
            <textarea
              rows="4"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="button-row">
            <button type="submit" className="btn-primary">
              {isEditMode ? "Update" : "Add"}
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("/superadmin/holidays")}
            >
              Cancel
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

export default AddHoliday;