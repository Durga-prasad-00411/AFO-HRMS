import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/Addemployee.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Select from "react-select";
import Toast from "../../components/Toast";

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const formRef = useRef();

  const [activeTab, setActiveTab] = useState("personal");

  const tabs = [
    "personal",
    "job",
    "role",
    "probation",
    "experience",
    "salary",
    "kyc",
    "system",
  ];

  useEffect(() => {
    /* DEPARTMENTS */
    fetch("http://localhost:5000/api/departments")
      .then((res) => res.json())
      .then((result) => {
        const departments = result.data || [];

        setDepartments(
          departments.map((d) => ({
            value: d.id,
            label: `${d.code} - ${d.name}`,
          })),
        );
      })
      .catch((err) => console.error("Department fetch error:", err));

    /* DESIGNATIONS */
    fetch("http://localhost:5000/api/designations")
      .then((res) => res.json())
      .then((result) => {
        const designations = result.data || [];

        setDesignations(
          designations.map((d) => ({
            value: d.id,
            label: `${d.code} - ${d.name}`,
          })),
        );
      })
      .catch((err) => console.error("Designation fetch error:", err));

    /* SHIFTS */
    fetch("http://localhost:5000/api/shifts", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Shifts:", data); // debug

        setShifts(
          data.map((s) => ({
            value: s.id,
            label: s.shift_name,
          })),
        );
      })
      .catch((err) => console.error("Shift fetch error:", err));

    if (isEditMode) {
      fetch(`http://localhost:5000/api/employees/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : "",
            gender: data.gender || "",
            address: data.address || "",
            profile_photo: null,
            hire_date: data.joining_date ? data.joining_date.split('T')[0] : "",
            department_id: data.department_id || "",
            designation_id: data.designation_id || "",
            reporting_to: data.reporting_to || "",
            company_type: data.company_type || "",
            onboarding_status: data.onboarding_status || "",
            hierarchy_level: data.hierarchy_level || "",
            role_responsibility: data.role_responsibility || "",
            employee_role: data.employee_role || "", // This might need mapping from role_id if not returned as string
            notice_period: data.notice_period_days || "",
            probation_applicable: data.probation_start_date ? "YES" : "NO",
            probation_days: "", // Would need calculation
            probation_end_date: data.probation_end_date ? data.probation_end_date.split('T')[0] : "",
            experience_years: data.experience_years || "",
            previous_company: data.previous_company || "",
            salary: data.salary || "",
            bank_name: data.bank_name || "",
            branch_name: data.branch_name || "",
            account_number: data.account_number || "",
            ifsc_code: data.ifsc_code || "",
            pan_number: data.pan_number || "",
            aadhaar_number: data.aadhar_number || "",
            pan_photo: null,
            aadhaar_photo: null,
            password: "", // Don't populate password
            work_type: data.work_type || "",
            shift_id: data.shift_id || "",
            status: data.status || "ACTIVE",
            home_lat: data.home_lat || "",
            home_long: data.home_long || "",
          });
        })
        .catch((err) => console.error("Fetch employee error:", err));
    }
  }, [id, isEditMode]);

  const [showPassword, setShowPassword] = useState(false);

  const [profilePreview, setProfilePreview] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);
  const [panPreview, setPanPreview] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const selectStyles = (name) => ({
    control: (base) => ({
      ...base,
      borderRadius: "12px",
      minHeight: "45px",
      borderColor: errors[name] ? "#ef4444" : "#e2e8f0",
      backgroundColor: errors[name] ? "#fef2f2" : "white",
      boxShadow: errors[name] ? "0 0 0 1px #ef4444" : "none",
      "&:hover": {
        borderColor: errors[name] ? "#ef4444" : "#6366f1",
      },
    }),
  });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    profile_photo: null,

    hire_date: "",
    department_id: "",
    designation_id: "",
    reporting_to: "",
    company_type: "",
    onboarding_status: "",

    hierarchy_level: "",
    role_responsibility: "",
    employee_role: "",

    notice_period: "",
    probation_applicable: "",
    probation_days: "",
    probation_end_date: "",

    experience_years: "",
    previous_company: "",

    salary: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    ifsc_code: "",

    pan_number: "",
    aadhaar_number: "",
    pan_photo: null,
    aadhaar_photo: null,

    password: "",
    work_type: "",
    shift_id: "",
    status: "ACTIVE",
    home_lat: "",
    home_long: "",
  });

  const handleNext = () => {
    setErrors({});
    const newErrors = {};

    // Determine which fields are in the current tab
    const tabFields = {
      personal: ['profile_photo', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'address'],
      job: ['hire_date', 'department_id', 'designation_id', 'employment_type', 'reporting_to'],
      role: ['hierarchy_level', 'employee_role'],
      probation: ['notice_period', 'probation_applicable'],
      experience: ['experience_years'],
      salary: ['salary', 'bank_name', 'branch_name', 'account_number', 'ifsc_code'],
      kyc: ['aadhaar_number', 'aadhaar_photo', 'pan_number', 'pan_photo'],
      system: ['password', 'work_type', 'shift_id']
    };

    const currentFields = tabFields[activeTab] || [];
    currentFields.forEach(field => {
      // Password is only required in add mode
      if (field === 'password' && isEditMode) return;
      
      if (!form[field]) {
        newErrors[field] = true;
      }
    });

    // Special case for probation
    if (activeTab === 'probation' && form.probation_applicable === 'YES' && !form.probation_days) {
      newErrors.probation_days = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ 
        open: true, 
        message: "Please fill all required fields in this section.", 
        severity: "error" 
      });
      return;
    }

    const index = tabs.indexOf(activeTab);
    if (index < tabs.length - 1) {
      setActiveTab(tabs[index + 1]);
    }
  };

  /* HANDLE CHANGE */

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));

      if (name === "profile_photo") {
        setProfilePreview(URL.createObjectURL(files[0]));
      }

      if (name === "aadhaar_photo") {
        setAadhaarPreview(URL.createObjectURL(files[0]));
      }

      if (name === "pan_photo") {
        setPanPreview(URL.createObjectURL(files[0]));
      }

      return;
    }

    setForm((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "probation_applicable" && value === "NO") {
        updated.probation_days = "";
        updated.probation_end_date = "";
      }

      if (
        (name === "hire_date" || name === "probation_days") &&
        (name === "hire_date" ? value : prev.hire_date) &&
        prev.probation_applicable === "YES"
      ) {
        const joinDate =
          name === "hire_date" ? new Date(value) : new Date(prev.hire_date);

        const days =
          name === "probation_days"
            ? Number(value)
            : Number(prev.probation_days);

        if (!isNaN(days)) {
          const endDate = new Date(joinDate);

          endDate.setDate(endDate.getDate() + days);

          updated.probation_end_date = endDate.toISOString().split("T")[0];
        }
      }

      return updated;
    });
  };

  /* SUBMIT */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Full validation before final submit
    const newErrors = {};
    const requiredFields = [
      'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'address',
      'hire_date', 'department_id', 'designation_id', 'employment_type', 'reporting_to',
      'hierarchy_level', 'employee_role', 'notice_period', 'probation_applicable',
      'experience_years', 'salary', 'bank_name', 'branch_name', 'account_number', 'ifsc_code',
      'aadhaar_number', 'pan_number', 'password', 'work_type', 'shift_id',
      'profile_photo', 'aadhaar_photo', 'pan_photo'
    ];

    requiredFields.forEach(field => {
      if (!form[field] && (field !== 'password' || !isEditMode)) {
        newErrors[field] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ 
        open: true, 
        message: "Some required fields are missing. Please check all tabs.", 
        severity: "error" 
      });
      return;
    }

    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      const url = isEditMode
        ? `http://localhost:5000/api/employees/${id}`
        : "http://localhost:5000/api/employees/add";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ 
          open: true, 
          message: isEditMode ? "Employee Updated Successfully!" : "Employee Added Successfully!", 
          severity: "success" 
        });
        setTimeout(() => navigate("/superadmin/employee"), 1500);
      } else {
        setToast({ open: true, message: data.error || "Something went wrong", severity: "error" });
      }
    } catch (error) {
      setToast({ open: true, message: "Server error", severity: "error" });
    }
  };

  return (
    <div className={`employee-card ${Object.keys(errors).length > 0 ? "error-card" : ""}`}>
      <div className="employee-content">
        <h2>{isEditMode ? "Edit Employee" : "Add Employee"}</h2>

        {/* TABS */}

        <div className="employee-tabs">
          <button
            className={activeTab === "personal" ? "tab active" : "tab"}
            onClick={() => setActiveTab("personal")}
          >
            Personal Information
          </button>

          <button
            className={activeTab === "job" ? "tab active" : "tab"}
            onClick={() => setActiveTab("job")}
          >
            Job Details
          </button>

          <button
            className={activeTab === "role" ? "tab active" : "tab"}
            onClick={() => setActiveTab("role")}
          >
            Role & Hierarchy
          </button>

          <button
            className={activeTab === "probation" ? "tab active" : "tab"}
            onClick={() => setActiveTab("probation")}
          >
            Probation Details
          </button>

          <button
            className={activeTab === "experience" ? "tab active" : "tab"}
            onClick={() => setActiveTab("experience")}
          >
            Work Experience
          </button>

          <button
            className={activeTab === "salary" ? "tab active" : "tab"}
            onClick={() => setActiveTab("salary")}
          >
            Salary & Bank Details
          </button>

          <button
            className={activeTab === "kyc" ? "tab active" : "tab"}
            onClick={() => setActiveTab("kyc")}
          >
            KYC Details
          </button>

          <button
            className={activeTab === "system" ? "tab active" : "tab"}
            onClick={() => setActiveTab("system")}
          >
            Login & Work Settings
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* PERSONAL */}

          {activeTab === "personal" && (
            <>
              <h3 className="section-title">Personal Information</h3>

              <div className="employee-form-group">
                <label>Profile Photo *</label>

                {profilePreview && (
                  <img
                    src={profilePreview}
                    alt="preview"
                    className="employee-profile-img"
                  />
                )}

                <input
                  type="file"
                  name="profile_photo"
                  className={errors.profile_photo ? "error-field" : ""}
                  required
                  onChange={handleChange}
                />
                {form.profile_photo && <span style={{fontSize: '0.8rem', color: '#16a34a', marginLeft: '5px'}}>✓ File selected</span>}
              </div>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.first_name ? "error-label" : ""}>First Name *</label>
                  <input 
                    name="first_name" 
                    className={errors.first_name ? "error-field" : ""} 
                    required 
                    onChange={handleChange} 
                  
                    value={form.first_name} />
                </div>
                <div className="employee-form-group">
                  <label className={errors.last_name ? "error-label" : ""}>Last Name *</label>
                  <input 
                    name="last_name" 
                    className={errors.last_name ? "error-field" : ""} 
                    required 
                    onChange={handleChange} 
                  
                    value={form.last_name} />
                </div>
              </div>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.email ? "error-label" : ""}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    className={errors.email ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.email} />
                </div>
                <div className="employee-form-group">
                  <label className={errors.phone ? "error-label" : ""}>Phone *</label>
                  <input 
                    name="phone" 
                    className={errors.phone ? "error-field" : ""} 
                    required 
                    onChange={handleChange} 
                  
                    value={form.phone} />
                </div>
              </div>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.date_of_birth ? "error-label" : ""}>Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className={errors.date_of_birth ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.date_of_birth} />
                </div>
                <div className="employee-form-group">
                  <label className={errors.gender ? "error-label" : ""}>Gender *</label>
                  <select 
                    name="gender" 
                    className={errors.gender ? "error-field" : ""}
                    required 
                    onChange={handleChange}
                  
                    value={form.gender} >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="employee-form-group">
                <label className={errors.address ? "error-label" : ""}>Address *</label>
                <textarea
                  name="address"
                  className={errors.address ? "error-field" : ""}
                  required
                  onChange={handleChange}
                
                    value={form.address} ></textarea>
              </div>
            </>
          )}

          {/* JOB */}

          {activeTab === "job" && (
            <>
              <h3 className="section-title">Job Details</h3>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.hire_date ? "error-label" : ""}>Date of Joining *</label>
                  <input
                    type="date"
                    name="hire_date"
                    className={errors.hire_date ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.hire_date} />
                </div>

                <div className="employee-form-group">
                  <label className={errors.department_id ? "error-label" : ""}>Department *</label>

                  <Select
                    options={departments}
                    styles={selectStyles("department_id")}
                    placeholder="Search department..."
                    value={departments.find(d => d.value === form.department_id) || null}
                    onChange={(selected) =>
                      setForm((prev) => ({
                        ...prev,
                        department_id: selected.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.designation_id ? "error-label" : ""}>Designation *</label>

                  <Select
                    options={designations}
                    styles={selectStyles("designation_id")}
                    placeholder="Search designation..."
                    value={designations.find(d => d.value === form.designation_id) || null}
                    onChange={(selected) =>
                      setForm((prev) => ({
                        ...prev,
                        designation_id: selected.value,
                      }))
                    }
                  />
                </div>
                <div className="employee-form-group">
                  <label className={errors.employment_type ? "error-label" : ""}>Employment Type *</label>

                  <select
                    name="employment_type"
                    className={errors.employment_type ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.employment_type} >
                    <option value="">Select</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="CONSULTANT">Consultant</option>
                  </select>
                </div>
              </div>
              <div className="employee-form-group">
                <div className="employee-form-group">
                  <label className={errors.reporting_to ? "error-label" : ""}>Reporting To *</label>
                  <input 
                    name="reporting_to" 
                    className={errors.reporting_to ? "error-field" : ""}
                    required 
                    onChange={handleChange} 
                  
                    value={form.reporting_to} />
                </div>
              </div>
            </>
          )}

          {/* ROLE */}

          {activeTab === "role" && (
            <>
              <h3 className="section-title">Role & Hierarchy</h3>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.hierarchy_level ? "error-label" : ""}>Hierarchy Level *</label>
                  <select
                    name="hierarchy_level"
                    className={errors.hierarchy_level ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.hierarchy_level} >
                    <option value="">Select</option>
                    <option>Intern</option>
                    <option>Junior</option>
                    <option>Mid</option>
                    <option>Senior</option>
                    <option>Lead</option>
                    <option>Manager</option>
                  </select>
                </div>

                <div className="employee-form-group">
                  <label className={errors.employee_role ? "error-label" : ""}>Employee Role *</label>
                  <select 
                    name="employee_role" 
                    className={errors.employee_role ? "error-field" : ""}
                    required 
                    onChange={handleChange}
                  
                    value={form.employee_role} >
                    <option value="">Select</option>
                    <option>Admin</option>
                    <option>HR</option>
                    <option>Manager</option>
                    <option>Employee</option>
                  </select>
                </div>
              </div>

              <div className="employee-form-group">
                <label>Role & Responsibility</label>
                <textarea
                  name="role_responsibility"
                  onChange={handleChange}
                
                    value={form.role_responsibility} ></textarea>
              </div>
            </>
          )}

          {/* PROBATION */}

          {activeTab === "probation" && (
            <>
              <h3 className="section-title">Probation Details</h3>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.notice_period ? "error-label" : ""}>Notice Period (Days) *</label>
                  <input
                    type="number"
                    name="notice_period"
                    className={errors.notice_period ? "error-field" : ""}
                    min="0"
                    step="1"
                    required
                    onChange={handleChange}
                  
                    value={form.notice_period} />
                </div>
                <div className="employee-form-group">
                  <label className={errors.probation_applicable ? "error-label" : ""}>Probation Applicable *</label>

                  <select
                    name="probation_applicable"
                    className={errors.probation_applicable ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.probation_applicable} >
                    <option value="">Select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
              </div>

              {form.probation_applicable === "YES" && (
                <div className="employee-row">
                  <div className="employee-form-group">
                    <label className={errors.probation_days ? "error-label" : ""}>Probation Days *</label>
                    <input
                      type="number"
                      name="probation_days"
                      className={errors.probation_days ? "error-field" : ""}
                      required
                      onChange={handleChange}
                    
                    value={form.probation_days} />
                  </div>

                  <div className="employee-form-group">
                    <label>Probation End Date</label>
                    <input
                      type="date"
                      value={form.probation_end_date}
                      disabled
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* EXPERIENCE */}

          {activeTab === "experience" && (
            <>
              <h3 className="section-title">Work Experience</h3>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.experience_years ? "error-label" : ""}>Experience (Years) *</label>
                  <input
                    type="number"
                    name="experience_years"
                    className={errors.experience_years ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.experience_years} />
                </div>

                <div className="employee-form-group">
                  <label>Previous Company</label>
                  <input name="previous_company" onChange={handleChange} 
                    value={form.previous_company} />
                </div>
              </div>
            </>
          )}

          {/* SALARY */}

          {activeTab === "salary" && (
            <>
              <h3 className="section-title">Salary & Bank Details</h3>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.salary ? "error-label" : ""}>Salary *</label>
                  <input
                    type="number"
                    name="salary"
                    className={errors.salary ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.salary} />
                </div>

                <div className="employee-form-group">
                  <label className={errors.bank_name ? "error-label" : ""}>Bank Name *</label>
                  <input 
                    name="bank_name" 
                    className={errors.bank_name ? "error-field" : ""}
                    required 
                    onChange={handleChange} 
                  
                    value={form.bank_name} />
                </div>
              </div>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.branch_name ? "error-label" : ""}>Branch Name *</label>
                  <input 
                    name="branch_name" 
                    className={errors.branch_name ? "error-field" : ""}
                    required 
                    onChange={handleChange} 
                  
                    value={form.branch_name} />
                </div>

                <div className="employee-form-group">
                  <label className={errors.account_number ? "error-label" : ""}>Account Number *</label>
                  <input
                    name="account_number"
                    className={errors.account_number ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.account_number} />
                </div>
              </div>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.ifsc_code ? "error-label" : ""}>IFSC Code *</label>
                  <input 
                    name="ifsc_code" 
                    className={errors.ifsc_code ? "error-field" : ""}
                    required 
                    onChange={handleChange} 
                  
                    value={form.ifsc_code} />
                </div>
              </div>
            </>
          )}

          {/* KYC */}

          {activeTab === "kyc" && (
            <>
              <h3 className="section-title">KYC Details</h3>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.aadhaar_number ? "error-label" : ""}>Aadhaar Number *</label>
                  <input
                    name="aadhaar_number"
                    className={errors.aadhaar_number ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  
                    value={form.aadhaar_number} />
                </div>

                <div className="employee-form-group">
                  <label className={errors.aadhaar_photo ? "error-label" : ""}>Aadhaar Photo *</label>

                  {aadhaarPreview && (
                    <img
                      src={aadhaarPreview}
                      alt="preview"
                      className={`doc-preview ${errors.aadhaar_photo ? "error-field" : ""}`}
                    />
                  )}

                  <input
                    type="file"
                    name="aadhaar_photo"
                    className={errors.aadhaar_photo ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  />
                  {form.aadhaar_photo && <span style={{fontSize: '0.8rem', color: '#16a34a', marginLeft: '5px'}}>✓ File selected</span>}
                </div>
              </div>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.pan_number ? "error-label" : ""}>PAN Number *</label>
                  <input 
                    name="pan_number" 
                    className={errors.pan_number ? "error-field" : ""}
                    required 
                    onChange={handleChange} 
                  
                    value={form.pan_number} />
                </div>

                <div className="employee-form-group">
                  <label className={errors.pan_photo ? "error-label" : ""}>PAN Photo *</label>

                  {panPreview && (
                    <img
                      src={panPreview}
                      alt="preview"
                      className={`doc-preview ${errors.pan_photo ? "error-field" : ""}`}
                    />
                  )}

                  <input
                    type="file"
                    name="pan_photo"
                    className={errors.pan_photo ? "error-field" : ""}
                    required
                    onChange={handleChange}
                  />
                  {form.pan_photo && <span style={{fontSize: '0.8rem', color: '#16a34a', marginLeft: '5px'}}>✓ File selected</span>}
                </div>
              </div>
            </>
          )}

          {/* LOGIN */}

          {activeTab === "system" && (
            <>
              <h3 className="section-title">Login & Work Settings</h3>

              <div className="employee-row">
                <div className="employee-form-group">
                  <label className={errors.password ? "error-label" : ""}>Password *</label>

                  <div className={`password-input ${errors.password ? "error-field" : ""}`}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      onChange={handleChange}
                    
                    value={form.password} />

                    <span
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                <div className="employee-form-group">
                  <label className={errors.work_type ? "error-label" : ""}>Work Type *</label>
                  <select 
                    name="work_type" 
                    className={errors.work_type ? "error-field" : ""}
                    required 
                    onChange={handleChange}
                  
                    value={form.work_type} >
                    <option value="">Select</option>
                    <option value="OFFICE">🏢 Office</option>
                    <option value="WFH">🏠 Work From Home (WFH)</option>
                    <option value="HYBRID">🔄 Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="employee-row">
                {/* SHIFT */}
                <div className="employee-form-group">
                  <label className={errors.shift_id ? "error-label" : ""}>Shift *</label>

                  <Select
                    options={shifts}
                    styles={selectStyles("shift_id")}
                    placeholder="Search shift..."
                    value={shifts.find(s => s.value === form.shift_id) || null}
                    onChange={(selected) =>
                      setForm((prev) => ({
                        ...prev,
                        shift_id: selected.value,
                      }))
                    }
                  />
                </div>

                {/* STATUS */}
                <div className="employee-form-group">
                  <label>Status *</label>

                  <select
                    name="status"
                    value={form.status}
                    required
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="RESIGNED">RESIGNED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
              </div>

            </>
          )}

          {/* BUTTONS */}

          <div className="employee-button-bar">
            {activeTab !== "system" ? (
              <>
                <button
                  type="button"
                  className="employee-btn-next"
                  onClick={handleNext}
                >
                  Next
                </button>

                <button
                  type="button"
                  className="employee-btn-cancel"
                  onClick={() => navigate("/superadmin/employee")}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button type="submit" className="employee-btn-add">
                  {isEditMode ? "Update" : "Add"}
                </button>

                <button
                  type="button"
                  className="employee-btn-cancel"
                  onClick={() => navigate("/superadmin/employee")}
                >
                  Cancel
                </button>
              </>
            )}
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

export default AddEmployee;