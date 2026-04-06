import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/holidays.css";

const AddDepartment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    code: "",
  });

  useEffect(() => {
    if (isEditMode) {
      axios.get(`http://localhost:5000/api/departments/${id}`)
        .then(res => {
          const d = res.data.data;
          setForm({
            name: d.name || "",
            code: d.code || "",
          });
        })
        .catch(err => console.error(err));
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
   e.preventDefault();

   if (!form.name) {
     alert("Please fill required fields!");
     return;
   }

   try {
     if (isEditMode) {
       const res = await axios.put(
         `http://localhost:5000/api/departments/${id}`,
         form
       );
       alert(res.data.message);
     } else {
       const res = await axios.post(
         "http://localhost:5000/api/departments/create",
         form
       );
       alert(res.data.message);
     }
     navigate("/superadmin/departments");
   } catch (err) {
     alert(err.response?.data?.message || (isEditMode ? "Error updating department" : "Error adding department"));
   }
 };

  return (
    <div className="holiday-card">

      <div className="holiday-content">

        <h2>{isEditMode ? "Edit Department" : "Add New Department"}</h2>

        <form onSubmit={handleSubmit}>

          {/* Row */}
          <div className="row">

            <div className="form-group">
              <label>
                Department Name <span className="required">*</span>
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter Department Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Department Code</label>

              <input
                type="text"
                name="code"
                placeholder="Enter Department Code"
                value={form.code}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Buttons */}
          <div className="button-bar">

            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/superadmin/departments")}
            >
              Cancel
            </button>

            <button type="submit" className="btn-add">
              {isEditMode ? "Update Department" : "Create Department"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddDepartment;