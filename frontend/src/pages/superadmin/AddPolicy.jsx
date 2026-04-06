import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../styles/holidays.css";

const AddPolicy = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    description: "",
    applicableTo: "",
    startDate: "",
    endDate: "",
    createdBy: "",
    status: "",
    policyDocument: null,
  });

  useEffect(() => {
    if (isEditMode) {
      if (location.state?.policy) {
        const p = location.state.policy;
        setForm({
          title: p.title || "",
          description: p.description || "",
          applicableTo: p.applicable_to || "",
          startDate: p.start_date ? p.start_date.split("T")[0] : "",
          endDate: p.end_date ? p.end_date.split("T")[0] : "",
          createdBy: p.created_by || "",
          status: p.status || "",
          policyDocument: null,
        });
      } else {
        // Fetch if state not available
        fetch(`http://localhost:5000/api/policies/${id}`)
          .then(res => res.json())
          .then(data => {
            setForm({
              title: data.title || "",
              description: data.description || "",
              applicableTo: data.applicable_to || "",
              startDate: data.start_date ? data.start_date.split("T")[0] : "",
              endDate: data.end_date ? data.end_date.split("T")[0] : "",
              createdBy: data.created_by || "",
              status: data.status || "",
              policyDocument: null,
            });
          })
          .catch(err => console.error("Fetch policy error:", err));
      }
    }
  }, [id, isEditMode, location.state]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm({
      ...form,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Login expired. Please login again.");
      return;
    }

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (key === "policyDocument") {
        if (form.policyDocument) {
          formData.append("policyDocument", form.policyDocument);
        }
      } else {
        formData.append(key, form[key]);
      }
    });

    try {
      const url = isEditMode
        ? `http://localhost:5000/api/policies/${id}`
        : "http://localhost:5000/api/policies";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const data = JSON.parse(text);
      alert(data.message);
      navigate("/superadmin/companypolicies");

    } catch (err) {
      console.error("Policy submission error:", err);
      alert(err.message || "Error saving policy");
    }
  };

  return (
    <div className="holiday-card">
      <div className="holiday-content">

        <h2>{isEditMode ? "Edit Company Policy" : "Add Company Policy"}</h2>

        <form onSubmit={handleSubmit}>

          {/* Row 1 */}
          <div className="row">
            <div className="form-group">
              <label>Policy Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Applicable To</label>
              <select
                name="applicableTo"
                value={form.applicableTo}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option>All Employees</option>
                <option>Managers</option>
                <option>HR Team</option>
                <option>Specific Department</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Policy Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Row 2 */}
          <div className="row">
            <div className="form-group">
              <label>Policy Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Policy End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="row">
            <div className="form-group">
              <label>Introduced By</label>
              <input
                type="text"
                name="createdBy"
                value={form.createdBy}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          {/* Policy Document */}
          <div className="form-group">
            <label>Policy Document</label>
            <input
              type="file"
              name="policyDocument"
              onChange={handleChange}
              accept=".pdf,.doc,.docx"
            />
          </div>

          {/* Buttons */}
          <div className="button-bar">
            <button type="submit" className="btn-add">
              {isEditMode ? "Update Policy" : "Add Policy"}
            </button>

            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/superadmin/companypolicies")}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddPolicy;