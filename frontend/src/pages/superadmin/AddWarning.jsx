import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import "../../styles/tables.css";
import "../../styles/holidays.css";

const AddWarning = () => {
  const [warnings, setWarnings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState(null);
  const [formModeLabel, setFormModeLabel] = useState("Add New Warning");

  const [form, setForm] = useState({
    id: "",
    employee: "",
    title: "",
    category: "",
    warning_date: "",
    description: "",
    evidence: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWarnings();
    fetchEmployees();
  }, []);

  const getEmployeeName = (employee) =>
    employee?.name?.trim() ||
    `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();

  const fetchWarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/warnings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWarnings(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  const resetForm = () => {
    setForm({
      id: "",
      employee: "",
      title: "",
      category: "",
      warning_date: "",
      description: "",
      evidence: null,
      evidence_file: "",
    });
    setError("");
    setIsEditMode(false);
    setFormModeLabel("Add New Warning");
    setEmployeeSearch("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({
      ...prev,
      evidence: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.employee ||
      !form.title ||
      !form.category ||
      !form.warning_date ||
      !form.description
    ) {
      setError("All required fields must be filled.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("employee", form.employee);
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("warning_date", form.warning_date);
      formData.append("description", form.description);

      if (form.evidence) {
        formData.append("evidence", form.evidence);
      }

      if (isEditMode && form.id) {
        await axios.put(
          `http://localhost:5000/api/warnings/${form.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("Warning updated successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/warnings/add",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("Warning issued successfully!");
      }

      setShowFormModal(false);
      resetForm();
      fetchWarnings();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Server error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (warning) => {
    setForm({
      id: warning.id || warning.warning_id || "",
      employee: warning.employee || "",
      title: warning.title || "",
      category: warning.category || "",
      warning_date: warning.warning_date
        ? new Date(warning.warning_date).toISOString().split("T")[0]
        : "",
      description: warning.description || "",
      evidence: null,
      evidence_file: warning.evidence_file || "",
    });
    setIsEditMode(true);
    setFormModeLabel("Edit Warning");
    setShowFormModal(true);
    setEmployeeSearch(warning.employee || "");
    setError("");
  };

  const handleEmployeeSelect = (e) => {
    setForm((prev) => ({
      ...prev,
      employee: e.target.value,
    }));
    setError("");
  };

  const openViewModal = (warning) => {
    setSelectedWarning(warning);
    setShowViewModal(true);
  };

  const openDeleteModal = (warning) => {
    setSelectedWarning(warning);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedWarning) return;

    try {
      const token = localStorage.getItem("token");
      const warningId = selectedWarning.id || selectedWarning.warning_id;

      await axios.delete(`http://localhost:5000/api/warnings/${warningId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowDeleteModal(false);
      setSelectedWarning(null);
      fetchWarnings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete warning.");
    }
  };

  const filteredWarnings = warnings.filter(
    (warning) =>
      warning.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warning.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warning.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryClass = (category) => {
    const c = category?.toLowerCase() || "";
    if (c === "attendance") return "status-low";
    if (c === "behavior") return "status-high";
    if (c === "performance") return "status-normal";
    if (c === "policy violation") return "status-urgent";
    return "type-default";
  };

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.toLowerCase();
    return employees.filter((employee) => {
      const employeeName = getEmployeeName(employee).toLowerCase();
      const employeeCode = String(employee.employee_code || employee.id || "").toLowerCase();
      return employeeName.includes(search) || employeeCode.includes(search);
    });
  }, [employees, employeeSearch]);

  return (
    <div className="simple-container theme-pink">
      <h2 className="page-title">Warnings</h2>

      <div className="top-bar">
        <button className="small-btn" onClick={openAddModal}>
          + Add New Warning
        </button>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by employee or title"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="leave-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarnings.length > 0 ? (
              filteredWarnings.map((warning, index) => {
                const warningId = warning.id || warning.warning_id || index;
                return (
                  <tr key={warningId}>
                    <td>{warning.employee}</td>
                    <td>{warning.title}</td>
                    <td className={getCategoryClass(warning.category)}>{warning.category}</td>
                    <td>
                      {warning.warning_date
                        ? new Date(warning.warning_date)
                            .toISOString()
                            .split("T")[0]
                        : "-"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => openViewModal(warning)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => openEditModal(warning)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="icon-btn delete-btn"
                          onClick={() => openDeleteModal(warning)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5">No warnings found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: "700px", textAlign: "left" }}>
            <h3>{formModeLabel}</h3>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="row">
                <div className="form-group">
                  <label>Employee*</label>
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                  <select
                    name="employee"
                    value={form.employee}
                    onChange={handleEmployeeSelect}
                    required
                  >
                    <option value="">Select Employee</option>
                    {filteredEmployees.map((employee) => {
                      const employeeName = getEmployeeName(employee);
                      return (
                        <option key={employee.id} value={employeeName}>
                          {employee.employee_code || employee.id} - {employeeName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Warning Date*</label>
                  <input
                    type="date"
                    name="warning_date"
                    value={form.warning_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Warning Title*</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Warning Category*</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Attendance">Attendance</option>
                    <option value="Behavior">Behavior</option>
                    <option value="Performance">Performance</option>
                    <option value="Policy Violation">Policy Violation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description*</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Evidence (Optional)</label>
                <input
                  type="file"
                  accept=".jpg,.png,.pdf"
                  onChange={handleFileChange}
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <div className="button-bar">
                <button type="submit" className="btn-add" disabled={loading}>
                  {loading
                    ? "Submitting..."
                    : isEditMode
                    ? "Update"
                    : "Submit"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedWarning && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: "500px", textAlign: "left" }}>
            <h3>Warning Details</h3>
            <p><strong>Employee:</strong> {selectedWarning.employee}</p>
            <p><strong>Title:</strong> {selectedWarning.title}</p>
            <p><strong>Category:</strong> {selectedWarning.category}</p>
            <p>
              <strong>Date:</strong>{" "}
              {selectedWarning.warning_date
                ? new Date(selectedWarning.warning_date)
                    .toISOString()
                    .split("T")[0]
                : "-"}
            </p>
            <p><strong>Description:</strong> {selectedWarning.description}</p>
            {selectedWarning.evidence_file && (
              <p>
                <strong>Evidence:</strong>{" "}
                <a
                  href={`http://localhost:5000/uploads/warnings/${selectedWarning.evidence_file}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View File
                </a>
              </p>
            )}
            <div className="modal-buttons">
              <button className="no-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedWarning && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Are you sure you want to delete this warning?</p>
            <div className="modal-buttons">
              <button className="yes-btn" onClick={handleDelete}>
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

export default AddWarning;
