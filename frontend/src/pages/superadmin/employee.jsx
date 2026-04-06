import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import axios from "axios";
import Select from "react-select";
import "../../styles/tables.css";

const EmployeeTable = () => {

const navigate = useNavigate();

const [employees, setEmployees] = useState([]);
const [loading, setLoading] = useState(true);

const [searchTerm, setSearchTerm] = useState("");
const [filterStatus, setFilterStatus] = useState("All");

const [selectedEmployee, setSelectedEmployee] = useState(null);

const [showViewModal, setShowViewModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showStatusModal, setShowStatusModal] = useState(false);

const [reason, setReason] = useState("");

/* FILTER STATES */

const [departments, setDepartments] = useState([]);
const [designations, setDesignations] = useState([]);
const [shifts, setShifts] = useState([]);

const [selectedDepartment, setSelectedDepartment] = useState(null);
const [selectedDesignation, setSelectedDesignation] = useState(null);
const [selectedShift, setSelectedShift] = useState(null);

/* ================= FETCH DATA ================= */

useEffect(() => {
fetchEmployees();
fetchDepartments();
fetchDesignations();
fetchShifts();
}, []);

const fetchEmployees = async () => {

try {

const res = await axios.get("http://localhost:5000/api/employees");
setEmployees(res.data);
setLoading(false);

} catch (error) {

console.error("Fetch Error:", error);
setLoading(false);

}

};

const fetchDepartments = async () => {

const res = await axios.get("http://localhost:5000/api/departments");

const list = res.data.data || [];

setDepartments(
list.map(d => ({
value: d.id,
label: d.name
}))
);

};

const fetchDesignations = async () => {

const res = await axios.get("http://localhost:5000/api/designations");

const list = res.data.data || [];

setDesignations(
list.map(d => ({
value: d.id,
label: d.name
}))
);

};

const fetchShifts = async () => {

try {

const token = localStorage.getItem("token");

const res = await axios.get(
"http://localhost:5000/api/shifts",
{
headers: {
Authorization: `Bearer ${token}`
}
}
);

const shiftList = res.data.data || res.data;

setShifts(
shiftList.map((s) => ({
value: s.id,
label: s.shift_name
}))
);

} catch (error) {

console.error("Shift Fetch Error:", error);

}

};

/* ================= FILTER ================= */

const filteredEmployees = employees.filter((emp) => {

const matchSearch =
emp.name?.toLowerCase().includes(searchTerm.toLowerCase());

const matchStatus =
filterStatus === "All" ||
emp.status?.toLowerCase() === filterStatus.toLowerCase();

const matchDepartment =
!selectedDepartment || emp.department_id === selectedDepartment.value;

const matchDesignation =
!selectedDesignation || emp.designation_id === selectedDesignation.value;

const matchShift =
!selectedShift || emp.shift === selectedShift.label;

return (
matchSearch &&
matchStatus &&
matchDepartment &&
matchDesignation &&
matchShift
);

});

/* ================= VIEW ================= */

const handleViewClick = (emp) => {
setSelectedEmployee(emp);
setShowViewModal(true);
};

/* ================= DELETE ================= */

const handleDeleteClick = (emp) => {
setSelectedEmployee(emp);
setShowDeleteModal(true);
};

const confirmDelete = async () => {

try {

await axios.delete(
`http://localhost:5000/api/employees/${selectedEmployee.id}`
);

fetchEmployees();
setShowDeleteModal(false);

} catch (error) {

console.error("Delete Error:", error);

}

};

/* ================= STATUS ================= */

const handleStatusClick = (emp) => {
setSelectedEmployee(emp);
setReason("");
setShowStatusModal(true);
};

const confirmStatusChange = async () => {

if (!reason.trim()) {
alert("Please enter reason for status change");
return;
}

try {

const newStatus =
selectedEmployee.status?.toLowerCase() === "active"
? "Inactive"
: "Active";

await axios.put(
`http://localhost:5000/api/employees/${selectedEmployee.id}/status`,
{
status: newStatus,
reason: reason
}
);

const updatedEmployees = employees.map((emp) => {

if (emp.id === selectedEmployee.id) {
return { ...emp, status: newStatus };
}

return emp;

});

setEmployees(updatedEmployees);
setShowStatusModal(false);

} catch (error) {

console.error("Status Update Error:", error);

}

};

return (

<div className="simple-container theme-blue">

<h2 className="page-title">Employees</h2>

{/* TOP BAR */}

<div className="top-bar">

<button
className="small-btn"
onClick={() => navigate("/superadmin/addemployee")}
>
+ Add New Employee
</button>

<div className="search-wrapper">

<input
type="text"
placeholder="Search employee"
className="search-input"
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
/>

<FaSearch className="search-icon" />

</div>

</div>

{/* FILTER HEADER */}

<div className="filter-header">

<div className="filter-buttons">

<button
className={filterStatus === "All" ? "filter-active" : ""}
onClick={() => setFilterStatus("All")}
>
All
</button>

<button
className={filterStatus === "Active" ? "filter-active" : ""}
onClick={() => setFilterStatus("Active")}
>
Active
</button>

<button
className={filterStatus === "Inactive" ? "filter-active" : ""}
onClick={() => setFilterStatus("Inactive")}
>
Inactive
</button>

</div>

<div className="dropdown-filters">

<Select
options={shifts}
placeholder="Shift"
value={selectedShift}
onChange={setSelectedShift}
isClearable
/>

<Select
options={departments}
placeholder="Department"
value={selectedDepartment}
onChange={setSelectedDepartment}
isClearable
/>

<Select
options={designations}
placeholder="Designation"
value={selectedDesignation}
onChange={setSelectedDesignation}
isClearable
/>

</div>

</div>

{/* TABLE */}

<div className="table-wrapper">

<table className="leave-table">

<thead>

<tr>
<th>ID</th>
<th>Name</th>
<th>Email</th>
<th>Phone</th>
<th>Employment Type</th>
<th>Status</th>
<th>Actions</th>
</tr>

</thead>

<tbody>

{loading ? (
<tr>
<td colSpan="7">Loading...</td>
</tr>
) : filteredEmployees.length > 0 ? (

filteredEmployees.map((emp) => (

<tr key={emp.id}>

<td>{emp.employee_code}</td>
<td>{emp.name}</td>
<td>{emp.email}</td>
<td>{emp.phone || "N/A"}</td>
<td>{emp.employment_type}</td>

<td className="status-cell">
  <button
    className={`status-pill ${emp.status?.toLowerCase() === "inactive" ? "inactive" : "active"}`}
    style={{ border: 'none', cursor: 'pointer' }}
    onClick={() => typeof handleStatusClick === 'function' && handleStatusClick(emp)}
  >
    {emp.status || "Active"}
  </button>
</td>

<td>

<div className="action-buttons">

<button
className="icon-btn view-btn"
onClick={() => handleViewClick(emp)}
>
<FaEye />
</button>

<button
className="icon-btn edit-btn"
onClick={() =>
navigate(`/superadmin/edit-employee/${emp.id}`)
}
>
<FaEdit />
</button>

<button
className="icon-btn delete-btn"
onClick={() => handleDeleteClick(emp)}
>
<FaTrash />
</button>

</div>

</td>

</tr>

))

) : (
<tr>
<td colSpan="7">No employees found</td>
</tr>
)}

</tbody>

</table>

</div>

{/* VIEW MODAL */}

{showViewModal && selectedEmployee && (

<div className="modal-overlay">
<div className="modal-box">

<h3>Employee Details</h3>

<p><b>Employee Code:</b> {selectedEmployee.employee_code}</p>
<p><b>Name:</b> {selectedEmployee.name}</p>
<p><b>Email:</b> {selectedEmployee.email}</p>
<p><b>Phone:</b> {selectedEmployee.phone}</p>
<p><b>Joining Date:</b> {selectedEmployee.joining_date}</p>
<p><b>Employment Type:</b> {selectedEmployee.employment_type}</p>
<p><b>Status:</b> {selectedEmployee.status}</p>

<div className="modal-buttons">

<button
className="no-btn"
onClick={() => setShowViewModal(false)}
>
Close
</button>

</div>

</div>
</div>

)}

{/* DELETE MODAL */}

{showDeleteModal && (

<div className="modal-overlay">
<div className="modal-box">

<p>Are you sure you want to delete this employee?</p>

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

{/* STATUS MODAL */}

{showStatusModal && selectedEmployee && (

<div className="modal-overlay">
<div className="modal-box">

<p>
Are you sure you want to change status of
<b> {selectedEmployee.name}</b> ?
</p>

<textarea
placeholder="Enter reason..."
value={reason}
onChange={(e) => setReason(e.target.value)}
style={{ width:"100%", marginTop:"10px", padding:"8px" }}
/>

<div className="modal-buttons">

<button
className="yes-btn"
onClick={confirmStatusChange}
>
Yes
</button>

<button
className="no-btn"
onClick={() => setShowStatusModal(false)}
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

export default EmployeeTable;