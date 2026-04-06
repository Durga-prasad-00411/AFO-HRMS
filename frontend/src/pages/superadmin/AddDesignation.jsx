import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/holidays.css";

const AddDesignation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
  });

  useEffect(() => {
    const fetchDesignation = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/designations/${id}`);
        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to fetch designation");
          navigate("/superadmin/designations");
          return;
        }

        setForm({
          name: data?.data?.name || "",
          code: data?.data?.code || "",
        });
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong");
        navigate("/superadmin/designations");
      } finally {
        setLoading(false);
      }
    };

    fetchDesignation();
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please fill required fields!");
      return;
    }

    try {
      const response = await fetch(
        isEditMode
          ? `http://localhost:5000/api/designations/${id}`
          : "http://localhost:5000/api/designations",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            (isEditMode
              ? "Failed to update designation"
              : "Failed to create designation")
        );
        return;
      }

      alert(
        isEditMode
          ? "Designation updated successfully!"
          : "Designation added successfully!"
      );

      setForm({ name: "", code: "" });

      navigate("/superadmin/designations");

    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="holiday-card">
      <div className="holiday-content">
        <h2>{isEditMode ? "Edit Designation" : "Add New Designation"}</h2>

        {loading ? (
          <p>Loading designation...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="form-group">
                <label>
                  Designation Name <span className="required">*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter Designation Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Designation Code</label>

                <input
                  type="text"
                  name="code"
                  placeholder="Enter Designation Code"
                  value={form.code}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="button-bar">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/superadmin/designations")}
              >
                Cancel
              </button>

              <button type="submit" className="btn-add">
                {isEditMode ? "Update Designation" : "Create Designation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddDesignation;
