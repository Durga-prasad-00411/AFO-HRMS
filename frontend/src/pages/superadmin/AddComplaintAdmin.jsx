import React, { useEffect, useMemo, useState } from "react";
import { FaEdit, FaEye, FaSearch, FaTrash } from "react-icons/fa";
import "../../styles/tables.css";
import "../../styles/holidays.css";

const AddComplaintAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromEmployeeSearch, setFromEmployeeSearch] = useState("");
  const [againstEmployeeSearch, setAgainstEmployeeSearch] = useState("");
  const [showFormCard, setShowFormCard] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fromEmployee: "",
    againstEmployee: "",
    complaintDate: "",
    category: "",
    subject: "",
    description: "",
    priority: "Normal",
    status: "Pending",
    adminRemarks: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm({
      fromEmployee: "",
      againstEmployee: "",
      complaintDate: "",
      category: "",
      subject: "",
      description: "",
      priority: "Normal",
      status: "Pending",
      adminRemarks: "",
    });
    setIsEditMode(false);
    setEditId(null);
    setFromEmployeeSearch("");
    setAgainstEmployeeSearch("");
  };

  const getEmployeeName = (employee) =>
    employee?.name?.trim() ||
    `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      setEmployees([]);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/complaints", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch complaints");
      }

      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      setComplaints([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchComplaints();
  }, []);

  const openAddForm = () => {
    resetForm();
    setShowFormCard(true);
  };

  const openEditForm = (item) => {
    const fromEmployee = item.from_employee || "";
    const againstEmployee = item.against_employee || "";
    setForm({
      fromEmployee,
      againstEmployee,
      complaintDate: item.complaint_date
        ? new Date(item.complaint_date).toISOString().split("T")[0]
        : "",
      category: item.category || "",
      subject: item.subject || "",
      description: item.description || "",
      priority: item.priority || "Normal",
      status: item.status || "Pending",
      adminRemarks: item.admin_remarks || "",
    });
    setIsEditMode(true);
    setEditId(item.id);
    setShowFormCard(true);
    setFromEmployeeSearch(fromEmployee);
    setAgainstEmployeeSearch(againstEmployee);
  };

  const openViewModal = (item) => {
    setSelectedComplaint(item);
    setShowViewModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedComplaint(item);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const url = isEditMode
        ? `http://localhost:5000/api/complaints/${editId}`
        : "http://localhost:5000/api/complaints/add";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      let data = {};
      const text = await response.text();
      if (text) data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.message || "Failed to save complaint");
      }

      resetForm();
      setShowFormCard(false);
      await fetchComplaints();
      alert(isEditMode ? "Complaint updated successfully!" : "Complaint created successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedComplaint?.id) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/complaints/${selectedComplaint.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete complaint");
      }

      setShowDeleteModal(false);
      setSelectedComplaint(null);
      await fetchComplaints();
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to delete complaint");
    }
  };

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((item) => {
        const search = searchTerm.toLowerCase();
        return (
          item.from_employee?.toLowerCase().includes(search) ||
          item.subject?.toLowerCase().includes(search) ||
          item.category?.toLowerCase().includes(search)
        );
      }),
    [complaints, searchTerm]
  );

  const getPriorityClass = (priority) => {
    const p = priority?.toLowerCase() || "";
    if (p === "urgent" || p === "high") return "status-high";
    if (p === "normal") return "status-normal";
    return "status-low";
  };

  const getStatusClass = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "resolved" || s === "closed") return "status-resolved";
    if (s === "pending" || s === "under review") return "status-pending";
    if (s === "rejected") return "status-inactive";
    return "";
  };

  const filteredFromEmployees = useMemo(() => {
    const search = fromEmployeeSearch.toLowerCase();
    return employees.filter((employee) => {
      const employeeName = getEmployeeName(employee).toLowerCase();
      const employeeCode = String(employee.employee_code || employee.id || "").toLowerCase();
      return employeeName.includes(search) || employeeCode.includes(search);
    });
  }, [employees, fromEmployeeSearch]);

  const filteredAgainstEmployees = useMemo(() => {
    const search = againstEmployeeSearch.toLowerCase();
    return employees.filter((employee) => {
      const employeeName = getEmployeeName(employee).toLowerCase();
      const employeeCode = String(employee.employee_code || employee.id || "").toLowerCase();
      return employeeName.includes(search) || employeeCode.includes(search);
    });
  }, [employees, againstEmployeeSearch]);

  return (
    <div className="simple-container theme-orange">
      {!showFormCard ? (
        <>
          <h2 className="page-title">Complaints</h2>

          <div className="top-bar">
            <button className="small-btn" onClick={openAddForm}>
              + Add New Complaint
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
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map((item) => (
                    <tr key={item.id}>
                      <td>{item.from_employee || "-"}</td>
                      <td>{item.subject || "-"}</td>
                      <td>{item.category || "-"}</td>
                      <td className={getPriorityClass(item.priority)}>{item.priority}</td>
                      <td className={getStatusClass(item.status)}>{item.status}</td>
                      <td>
                        {item.complaint_date
                          ? new Date(item.complaint_date).toISOString().split("T")[0]
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
                    <td colSpan="5">No complaints found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="holiday-card">
          <div className="holiday-content">
            <h2>{isEditMode ? "Edit Complaint" : "Create Complaint"}</h2>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="form-group">
                  <label>
                    From Employee <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    value={fromEmployeeSearch}
                    onChange={(e) => setFromEmployeeSearch(e.target.value)}
                    placeholder="Search employee..."
                  />
                  <select
                    name="fromEmployee"
                    value={form.fromEmployee}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Employee</option>
                    {filteredFromEmployees.map((employee) => {
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
                  <label>
                    Against Employee <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    value={againstEmployeeSearch}
                    onChange={(e) => setAgainstEmployeeSearch(e.target.value)}
                    placeholder="Search employee..."
                  />
                  <select
                    name="againstEmployee"
                    value={form.againstEmployee}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Employee</option>
                    {filteredAgainstEmployees.map((employee) => {
                      const employeeName = getEmployeeName(employee);
                      return (
                        <option key={employee.id} value={employeeName}>
                          {employee.employee_code || employee.id} - {employeeName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>
                    Complaint Date <span className="required">*</span>
                  </label>

                  <input
                    type="date"
                    name="complaintDate"
                    value={form.complaintDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Category <span className="required">*</span>
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option>Workplace Harassment</option>
                    <option>Manager Issue</option>
                    <option>Salary Issue</option>
                    <option>Discrimination</option>
                    <option>Policy Violation</option>
                    <option>Misconduct</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Title</label>

                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Enter complaint title"
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option>Pending</option>
                    <option>Under Review</option>
                    <option>Resolved</option>
                    <option>Rejected</option>
                    <option>Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Admin Remarks</label>
                  <input
                    type="text"
                    name="adminRemarks"
                    value={form.adminRemarks}
                    onChange={handleChange}
                    placeholder="Optional remarks"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Description <span className="required">*</span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the issue"
                  required
                />
              </div>

              <div className="button-bar">
                <button type="submit" className="btn-add" disabled={loading}>
                  {loading ? "Submitting..." : isEditMode ? "Update" : "Submit"}
                </button>

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    resetForm();
                    setShowFormCard(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: "500px", textAlign: "left" }}>
            <h3>Complaint Details</h3>
            <p><strong>Employee:</strong> {selectedComplaint.from_employee || "-"}</p>
            <p><strong>Title:</strong> {selectedComplaint.subject || "-"}</p>
            <p><strong>Category:</strong> {selectedComplaint.category || "-"}</p>
            <p>
              <strong>Date:</strong>{" "}
              {selectedComplaint.complaint_date
                ? new Date(selectedComplaint.complaint_date).toISOString().split("T")[0]
                : "-"}
            </p>
            <p><strong>Description:</strong> {selectedComplaint.description || "-"}</p>
            <div className="modal-buttons">
              <button className="no-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Are you sure you want to delete this complaint?</p>
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

export default AddComplaintAdmin;
