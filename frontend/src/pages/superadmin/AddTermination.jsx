import React, { useEffect, useMemo, useState } from "react";
import { FaEdit, FaEye, FaSearch, FaTrash } from "react-icons/fa";
import "../../styles/tables.css";
import "../../styles/addTermination.css";
import Toast from "../../components/Toast";

const AddTermination = () => {
  const [employees, setEmployees] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormCard, setShowFormCard] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTermination, setSelectedTermination] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const [form, setForm] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    designation: "",
    noticeDate: "",
    noticePeriod: "",
    lastWorkingDay: "",
    terminationType: "",
    reason: "",
    remarks: "",
    rehireEligible: "No",
    status: "Terminated",
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      } catch (fetchError) {
        console.log("Employee fetch error", fetchError);
      }
    };

    fetchEmployees();
  }, []);

  const fetchTerminations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/terminations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch terminations");
      }
      setTerminations(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.log("Termination fetch error", fetchError);
      setTerminations([]);
    }
  };

  useEffect(() => {
    fetchTerminations();
  }, []);

  const resetForm = () => {
    setForm({
      employeeId: "",
      employeeName: "",
      department: "",
      designation: "",
      noticeDate: "",
      noticePeriod: "",
      lastWorkingDay: "",
      terminationType: "",
      reason: "",
      remarks: "",
      rehireEligible: "No",
      status: "Terminated",
    });
    setIsEditMode(false);
    setEditId(null);
    setEmployeeSearch("");
    setError("");
  };

  const getEmployeeName = (employee) =>
    employee?.name?.trim() ||
    `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    const selectedEmployee = employees.find(
      (emp) => emp.id.toString() === selectedId
    );

    if (!selectedEmployee) {
      setForm((prev) => ({
        ...prev,
        employeeId: "",
        employeeName: "",
        department: "",
        designation: "",
      }));
      return;
    }

    const employeeName =
      selectedEmployee.name?.trim() ||
      `${selectedEmployee.first_name || ""} ${selectedEmployee.last_name || ""}`.trim();

    const department =
      selectedEmployee.department ||
      selectedEmployee.department_name ||
      selectedEmployee.dept_name ||
      "";

    const designation =
      selectedEmployee.designation ||
      selectedEmployee.designation_name ||
      selectedEmployee.role ||
      "";

    setForm((prev) => ({
      ...prev,
      employeeId: selectedEmployee.id,
      employeeName,
      department,
      designation,
    }));
  };

  useEffect(() => {
    if (!form.noticeDate || !form.noticePeriod) return;

    const date = new Date(form.noticeDate);
    date.setDate(date.getDate() + Number(form.noticePeriod));

    setForm((prev) => ({
      ...prev,
      lastWorkingDay: date.toISOString().split("T")[0],
    }));
  }, [form.noticeDate, form.noticePeriod]);

  const openAddForm = () => {
    resetForm();
    setShowFormCard(true);
  };

  const openEditForm = (item) => {
    setForm({
      employeeId: item.employeeId || "",
      employeeName: item.employeeName || "",
      department: item.department || "",
      designation: item.designation || "",
      noticeDate: item.noticeDate ? new Date(item.noticeDate).toISOString().split("T")[0] : "",
      noticePeriod: item.noticePeriod || "",
      lastWorkingDay: item.lastWorkingDay
        ? new Date(item.lastWorkingDay).toISOString().split("T")[0]
        : "",
      terminationType: item.terminationType || "",
      reason: item.reason || "",
      remarks: item.remarks || "",
      rehireEligible: item.rehireEligible || "No",
      status: item.status || "Terminated",
    });
    setEditId(item.id);
    setIsEditMode(true);
    setShowFormCard(true);
    setEmployeeSearch(item.employeeName || item.employeeId?.toString() || "");
    setError("");
  };

  const openViewModal = (item) => {
    setSelectedTermination(item);
    setShowViewModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedTermination(item);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!form.employeeId) newErrors.employeeId = true;
    if (!form.noticeDate) newErrors.noticeDate = true;
    if (!form.noticePeriod) newErrors.noticePeriod = true;
    if (!form.terminationType) newErrors.terminationType = true;
    if (!form.reason) newErrors.reason = true;

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
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = isEditMode
        ? `http://localhost:5000/api/terminations/${editId}`
        : "http://localhost:5000/api/terminations";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setToast({ open: true, message: data.message || "Failed to save termination.", severity: "error" });
        return;
      }

      setToast({ 
        open: true, 
        message: isEditMode ? "Termination Updated Successfully! ✅" : "Termination Added Successfully! ✅", 
        severity: "success" 
      });
      
      setTimeout(() => {
        setShowFormCard(false);
        resetForm();
        fetchTerminations();
      }, 1500);

    } catch (submitError) {
      setToast({ open: true, message: "Server error", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTermination?.id) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/terminations/${selectedTermination.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete termination.");
      }

      setShowDeleteModal(false);
      setSelectedTermination(null);
      await fetchTerminations();
    } catch (deleteError) {
      console.log(deleteError);
      alert(deleteError.message || "Failed to delete termination.");
    }
  };

  const filteredTerminations = useMemo(
    () =>
      terminations.filter(
        (item) =>
          item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.terminationType?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [terminations, searchTerm]
  );

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.toLowerCase();
    return employees.filter((employee) => {
      const employeeName = getEmployeeName(employee).toLowerCase();
      const employeeCode = String(employee.employee_code || employee.id || "").toLowerCase();
      return employeeName.includes(search) || employeeCode.includes(search);
    });
  }, [employees, employeeSearch]);

  return (
    <div className="simple-container theme-red">
      {!showFormCard ? (
        <>
          <h2 className="page-title">Terminations</h2>

          <div className="top-bar">
            <button className="small-btn" onClick={openAddForm}>
              + Add New Termination
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
                {filteredTerminations.length > 0 ? (
                  filteredTerminations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.employeeName || "-"}</td>
                      <td>{item.terminationType || "-"}</td>
                      <td className={item.status?.toLowerCase() === "terminated" ? "status-inactive" : "status-active"}>
                        {item.status || "Terminated"}
                      </td>
                      <td>
                        {item.noticeDate
                          ? new Date(item.noticeDate).toISOString().split("T")[0]
                          : "-"}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="icon-btn edit-btn"
                            onClick={() => openViewModal(item)}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="icon-btn edit-btn"
                            onClick={() => openEditForm(item)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="icon-btn delete-btn"
                            onClick={() => openDeleteModal(item)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No terminations found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={`termination-form-card ${Object.keys(errors).length > 0 ? "error-card" : ""}`}>
          <h3 className="termination-form-title">
            {isEditMode ? "Edit Termination" : "Employee Termination"}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="termination-grid">
              <div className="form-group">
                <label className={errors.employeeId ? "error-label" : ""}>
                  Employee ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={errors.employeeId ? "error-field" : ""}
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search employee..."
                  disabled={isEditMode}
                />
                <select
                  name="employeeSelect"
                  className={errors.employeeId ? "error-field" : ""}
                  value={form.employeeId}
                  onChange={handleEmployeeSelect}
                  disabled={isEditMode}
                >
                  <option value="">Select Employee ID</option>
                  {filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code || emp.id} - {getEmployeeName(emp)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className={errors.employeeId ? "error-label" : ""}>
                  Employee Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={errors.employeeId ? "error-field" : ""}
                  value={form.employeeName}
                  placeholder="Employee Name"
                  readOnly
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  placeholder="Enter Department"
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  placeholder="Enter Designation"
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className={errors.noticeDate ? "error-label" : ""}>
                  Notice Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="noticeDate"
                  className={errors.noticeDate ? "error-field" : ""}
                  value={form.noticeDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className={errors.noticePeriod ? "error-label" : ""}>
                  Notice Period (Days) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="noticePeriod"
                  className={errors.noticePeriod ? "error-field" : ""}
                  value={form.noticePeriod}
                  placeholder="Enter days"
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Last Working Day</label>
                <input type="date" value={form.lastWorkingDay} readOnly />
              </div>

              <div className="form-group">
                <label>Rehire Eligible?</label>
                <select
                  name="rehireEligible"
                  value={form.rehireEligible}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="form-group">
                <label className={errors.terminationType ? "error-label" : ""}>
                  Termination Type <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="terminationType"
                  className={errors.terminationType ? "error-field" : ""}
                  value={form.terminationType}
                  placeholder="Misconduct / Downsizing / Performance"
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <input value={form.status} readOnly />
              </div>
            </div>

            <div className="form-group termination-description-group">
              <label className={errors.reason ? "error-label" : ""}>
                Description <span className="required">*</span>
              </label>
              <textarea
                name="reason"
                className={errors.reason ? "error-field" : ""}
                value={form.reason}
                placeholder="Enter detailed termination reason and additional remarks"
                onChange={handleChange}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="termination-action-bar">
              <button type="submit" className="btn-add" disabled={loading}>
                {loading ? "Submitting..." : isEditMode ? "Update" : "Terminate"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowFormCard(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showViewModal && selectedTermination && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: "500px", textAlign: "left" }}>
            <h3>Termination Details</h3>
            <p><strong>Employee:</strong> {selectedTermination.employeeName || "-"}</p>
            <p><strong>Title:</strong> {selectedTermination.terminationType || "-"}</p>
            <p><strong>Category:</strong> {selectedTermination.status || "Terminated"}</p>
            <p>
              <strong>Date:</strong>{" "}
              {selectedTermination.noticeDate
                ? new Date(selectedTermination.noticeDate).toISOString().split("T")[0]
                : "-"}
            </p>
            <p><strong>Description:</strong> {selectedTermination.reason || "-"}</p>
            <div className="modal-buttons">
              <button className="no-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedTermination && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Are you sure you want to delete this termination?</p>
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

      <Toast 
        open={toast.open} 
        message={toast.message} 
        severity={toast.severity} 
        handleClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default AddTermination;
