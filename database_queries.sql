-- 1. DATABASE CREATION
CREATE DATABASE hrms;
USE hrms;

-- ==================================================================================
-- 2. TABLES CREATION
-- ==================================================================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL UNIQUE
);

-- Work Modes Table
CREATE TABLE work_modes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mode_name VARCHAR(255) NOT NULL UNIQUE
);

-- Shifts Table (add_shifts)
CREATE TABLE add_shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shift_name VARCHAR(255) NOT NULL,
    work_mode_id INT,
    clock_in TIME,
    clock_out TIME,
    early_clock_in VARCHAR(50),
    allow_clock_out VARCHAR(50),
    late_mark_after VARCHAR(50),
    FOREIGN KEY (work_mode_id) REFERENCES work_modes(id)
);

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    shift_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (shift_id) REFERENCES add_shifts(id)
);

-- Departments Table
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100)
);

-- Designations Table
CREATE TABLE designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100)
);

-- Employees Table
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department_id INT,
    designation_id INT,
    employee_code VARCHAR(50) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    gender VARCHAR(50),
    date_of_birth DATE,
    phone VARCHAR(20),
    address TEXT,
    office_location VARCHAR(255),
    aadhar_number VARCHAR(20),
    pan_number VARCHAR(20),
    experience_years VARCHAR(50),
    user_photo VARCHAR(255),
    aadhar_photo VARCHAR(255),
    pan_photo VARCHAR(255),
    joining_date DATE,
    employment_type VARCHAR(100),
    reporting_to VARCHAR(255),
    company_type VARCHAR(100),
    onboarding_status VARCHAR(100) DEFAULT 'Pending',
    hierarchy_level VARCHAR(100),
    role_responsibility TEXT,
    notice_period_days INT,
    previous_company VARCHAR(255),
    salary DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    work_type VARCHAR(50) DEFAULT 'OFFICE',
    home_lat DECIMAL(10, 8),
    home_long DECIMAL(11, 8),
    status_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (designation_id) REFERENCES designations(id)
);

-- Employee Probation Table
CREATE TABLE employee_probation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    probation_start_date DATE,
    probation_end_date DATE,
    status VARCHAR(50),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Account Details Table
CREATE TABLE account_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    ifsc_code VARCHAR(255),
    branch_name VARCHAR(255),
    pan_number VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Attendance Table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    checkout_latitude DECIMAL(10, 8),
    checkout_longitude DECIMAL(11, 8),
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Leave Types Table
CREATE TABLE leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_name VARCHAR(255) NOT NULL UNIQUE,
    leave_type VARCHAR(100),
    description TEXT,
    max_days INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    monthly_accrual DECIMAL(4,2) DEFAULT 0,
    carry_forward BOOLEAN DEFAULT FALSE
);

-- Leaves Table
CREATE TABLE leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Holidays Table
CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    description TEXT,
    holiday_type VARCHAR(100) DEFAULT 'FULL_DAY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recent Activities Table
CREATE TABLE recent_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type VARCHAR(100),
    activity_text TEXT,
    color VARCHAR(50) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appreciations Table
CREATE TABLE appreciations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_name VARCHAR(255),
    employee_id VARCHAR(100),
    award_title VARCHAR(255),
    award_date DATE,
    award_type VARCHAR(100),
    award_period VARCHAR(100),
    given_by VARCHAR(255),
    description TEXT
);

-- Assets Table
CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    account_number VARCHAR(255),
    purchase_date DATE,
    price DECIMAL(10, 2),
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Asset Allocations Table
CREATE TABLE asset_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    employee_id INT NOT NULL,
    allocation_datetime DATETIME,
    asset_condition VARCHAR(255),
    description TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Awards Table
CREATE TABLE awards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    award_title VARCHAR(255),
    award_type VARCHAR(100),
    description TEXT,
    file_path VARCHAR(255)
);

-- Complaints Table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_employee VARCHAR(255) NOT NULL,
    against_employee VARCHAR(255) NOT NULL,
    complaint_date DATE NOT NULL,
    category VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal',
    status VARCHAR(50) DEFAULT 'Pending',
    admin_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Policies Table
CREATE TABLE company_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    applicable_to VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_by_name VARCHAR(255),
    status VARCHAR(50),
    file_url VARCHAR(255),
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Terminations Table
CREATE TABLE employee_terminations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    designation VARCHAR(255),
    notice_date DATE NOT NULL,
    notice_period INT,
    last_working_day DATE,
    termination_type VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    remarks TEXT,
    rehire_eligible VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Terminated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Employee Warnings Table
CREATE TABLE employee_warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee VARCHAR(255),
    title VARCHAR(255),
    category VARCHAR(255),
    warning_date DATE,
    description TEXT,
    evidence_file VARCHAR(255),
    issued_by INT
);


-- Payroll Table
CREATE TABLE payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(10, 2) DEFAULT 0,
    hra DECIMAL(10, 2) DEFAULT 0,
    allowances DECIMAL(10, 2) DEFAULT 0,
    pf_deduction DECIMAL(10, 2) DEFAULT 0,
    tax_deduction DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) DEFAULT 0,
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'GENERATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE KEY unique_payroll_month (employee_id, month, year)
);


-- Performance Reviews Table
CREATE TABLE performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    review_date DATE NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100), -- E.g., 'LEAVE_REQUEST', 'PAYROLL_GENERATED'
    related_id INT, -- ID of the related entity (leave_request id, etc.)
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================================================================================
-- 3. SEED DATA (CORE ROLES & MODES)
-- ==================================================================================

INSERT IGNORE INTO roles (role_name) VALUES 
('SUPER_ADMIN'), ('ADMIN'), ('HR'), ('MANAGER'), ('TL'), ('EMPLOYEE');

INSERT IGNORE INTO work_modes (mode_name) VALUES 
('OFFICE'), ('REMOTE'), ('HYBRID');

-- Example Leave Types
INSERT IGNORE INTO leave_types (leave_name, leave_type, max_days, status, monthly_accrual, carry_forward) VALUES 
('Casual Leave', 'Paid', 12, 'Active', 1.00, 0),
('Sick Leave', 'Paid', 12, 'Active', 1.00, 1),
('Privilege Leave', 'Paid', 15, 'Active', 1.25, 1);

-- ==================================================================================
-- 4. SAMPLE DATA (OPTIONAL)
-- ==================================================================================

-- Note: Passwords should be hashed using bcrypt in actual usage.
-- This is just a structure example.
-- INSERT INTO users (username, email, password, role_id) VALUES ('superadmin', 'admin@hrms.com', '$2b$10$YourHashedPassword', 1);

-- ==================================================================================
-- 5. COMMON SELECT QUERIES FOR DATA REPORTING
-- ==================================================================================

-- Get Complete Employee List with Details
/* 
SELECT 
    e.*, 
    u.email, 
    u.username,
    r.role_name,
    d.name AS department_name, 
    ds.name AS designation_name,
    s.shift_name
FROM employees e
JOIN users u ON e.user_id = u.id
JOIN roles r ON u.role_id = r.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN designations ds ON e.designation_id = ds.id
LEFT JOIN add_shifts s ON u.shift_id = s.id;
*/

-- Get Attendance Report for a Month
/*
SELECT 
    a.*, 
    u.username, 
    e.first_name, 
    e.last_name
FROM attendance a
JOIN users u ON a.user_id = u.id
JOIN employees e ON u.id = e.user_id
WHERE MONTH(a.attendance_date) = 4 AND YEAR(a.attendance_date) = 2024;
*/
