import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ManagerDashboard from "./pages/Manager/ManagerDashboard";
import TeamLeadDashboard from "./pages/TeamLead/TeamLeadDashboard";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";

import AddEmployee from "./pages/superadmin/Addemployee";
import CompanyPolicies from "./pages/superadmin/CompanyPolicies";
import AddPolicy from "./pages/superadmin/AddPolicy";
import LeaveType from "./pages/superadmin/LeaveType";
import AddLeaveType from "./pages/superadmin/AddLeaveType";
import AddAsset from "./pages/superadmin/AddAsset";

import AddComplaintAdmin from "./pages/superadmin/AddComplaintAdmin";
import AddWarning from "./pages/superadmin/AddWarning";
import AddTermination from "./pages/superadmin/AddTermination";
import AddHoliday from "./pages/superadmin/Addholiday";
import AddDepartment from "./pages/superadmin/AddDepartment";
import Departments from "./pages/superadmin/Departments";
import AllocateAsset from "./pages/superadmin/AllocateAsset";
import AddAttendance from "./pages/superadmin/AddAttendance";
import AddManualAttendance from "./pages/superadmin/AddManualAttendance";
import AttendanceDetails from "./pages/superadmin/AttendanceDetails";
import AttendanceSummaryGrid from "./pages/superadmin/AttendanceSummaryGrid";
import MyAttendance from "./pages/MyAttendance";
import MyLeaves from "./pages/MyLeaves";
import AddDesignation from "./pages/superadmin/AddDesignation";
import AddShift from "./pages/superadmin/Addshift";
import Shifts from "./pages/superadmin/shifts";
import Designations from "./pages/superadmin/Designations";

import Appreciation from "./pages/superadmin/Appreciation";
import AddAppreciation from "./pages/superadmin/AddAppreciation";
import Award from "./pages/superadmin/Award";
import AddAward from "./pages/superadmin/AddAward";

import Employee from "./pages/superadmin/employee";
import Assets from "./pages/superadmin/Asset";
import Holidays from "./pages/superadmin/holidays";
import DashboardHome from "./pages/superadmin/DashboardHome";
import AdminDashboardHome from "./pages/Admin/DashboardHome";
import EmployeeDashboardHome from "./pages/Employee/DashboardHome";
import Payroll from "./pages/superadmin/Payroll";
import MyPayslips from "./pages/Employee/MyPayslips";
import PerformanceReviews from "./pages/superadmin/PerformanceReviews";
import MyPerformance from "./pages/Employee/MyPerformance";

import Leaves from "./pages/Leaves";
import ApplyLeave from "./pages/ApplyLeave";
import LeaveBalances from "./pages/LeaveBalances";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {["/superadmin", "/admin"].map((pathPrefix) => (
      <Route key={pathPrefix} element={<ProtectedRoute allowedRoles={pathPrefix === "/superadmin" ? ["SUPER_ADMIN"] : ["ADMIN"]} />}>
        <Route path={pathPrefix} element={<SuperAdminDashboard />}>
        
          <Route index element={<DashboardHome />} />

          <Route path="addemployee" element={<AddEmployee />} />
          <Route path="edit-employee/:id" element={<AddEmployee />} />
          <Route path="employee" element={<Employee />} />
          <Route path="departments" element={<Departments />} />
          <Route path="adddepartment" element={<AddDepartment />} />
          <Route path="edit-department/:id" element={<AddDepartment />} />
          <Route path="adddesignation" element={<AddDesignation />} />
          <Route path="edit-designation/:id" element={<AddDesignation />} />
          <Route path="designations" element={<Designations />} />
          <Route path="addshift" element={<AddShift />} />
          <Route path="edit-shift/:id" element={<AddShift />} />
          <Route path="shifts" element={<Shifts />} />

          <Route path="addappreciation" element={<AddAppreciation />} />
          <Route path="edit-appreciation/:id" element={<AddAppreciation />} />
          <Route path="appreciation" element={<Appreciation />} />
          <Route path="award" element={<Award />} />
          <Route path="addaward" element={<AddAward />} />
          <Route path="edit-award/:id" element={<AddAward />} />

          <Route path="users" element={<div>Users Page</div>} />

          <Route path="attendance" element={<AddAttendance />} />
          <Route path="add-attendance" element={<AddManualAttendance />} />
          <Route path="attendance-details" element={<AttendanceDetails />} />
          <Route path="attendance-summary" element={<AttendanceSummaryGrid />} />
          <Route path="my-attendance" element={<MyAttendance />} />

          <Route path="leaves" element={<Leaves />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="leave-balances" element={<LeaveBalances />} />
          <Route path="leave-types" element={<LeaveType />} />
          <Route path="add-leave-type" element={<AddLeaveType />} />
          <Route path="edit-leave-type/:id" element={<AddLeaveType />} />
          <Route path="my-leaves" element={<MyLeaves />} />

          <Route path="companypolicies" element={<CompanyPolicies />} />
          <Route path="addpolicy" element={<AddPolicy />} />
          <Route path="edit-policy/:id" element={<AddPolicy />} />

          <Route path="asset" element={<Assets />} />
          <Route path="add-asset" element={<AddAsset />} />
          <Route path="edit-asset/:id" element={<AddAsset />} />
          <Route path="allocate-asset" element={<AllocateAsset />} />

          <Route path="add-complaint" element={<AddComplaintAdmin />} />
          <Route path="warnings" element={<AddWarning />} />
          <Route path="terminations" element={<AddTermination />} />

          <Route path="holidays" element={<Holidays />} />
          <Route path="add-holiday" element={<AddHoliday />} />
          <Route path="edit-holiday/:id" element={<AddHoliday />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="mypayslips" element={<MyPayslips />} />
          <Route path="performance" element={<PerformanceReviews />} />
          <Route path="myperformance" element={<MyPerformance />} />
        </Route>
      </Route>
      ))}

      <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
        <Route path="/hr" element={<AdminDashboard />}>
          <Route index element={<AdminDashboardHome />} />
          <Route path="attendance-details" element={<AttendanceDetails />} />
          <Route path="mypayslips" element={<MyPayslips />} />
          <Route path="myperformance" element={<MyPerformance />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="leave-balances" element={<LeaveBalances />} />
          <Route path="my-attendance" element={<MyAttendance />} />
          <Route path="my-leaves" element={<MyLeaves />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
        <Route path="/manager" element={<ManagerDashboard />}>
          <Route index element={<EmployeeDashboardHome />} />
          <Route path="mypayslips" element={<MyPayslips />} />
          <Route path="myperformance" element={<MyPerformance />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="leave-balances" element={<LeaveBalances />} />
          <Route path="my-attendance" element={<MyAttendance />} />
          <Route path="my-leaves" element={<MyLeaves />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["TL", "TEAM_LEAD", "TEAMLEADER"]} />}>
        <Route path="/teamlead" element={<TeamLeadDashboard />}>
          <Route index element={<EmployeeDashboardHome />} />
          <Route path="mypayslips" element={<MyPayslips />} />
          <Route path="myperformance" element={<MyPerformance />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="leave-balances" element={<LeaveBalances />} />
          <Route path="my-attendance" element={<MyAttendance />} />
          <Route path="my-leaves" element={<MyLeaves />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE"]} />}>
        <Route path="/dashboard" element={<EmployeeDashboard />}>
          <Route index element={<EmployeeDashboardHome />} />
          <Route path="mypayslips" element={<MyPayslips />} />
          <Route path="myperformance" element={<MyPerformance />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="leave-balances" element={<LeaveBalances />} />
          <Route path="my-attendance" element={<MyAttendance />} />
          <Route path="my-leaves" element={<MyLeaves />} />
        </Route>
      </Route>

      {/* For global fallback if they navigate to /mypayslips instead of /dashboard/mypayslips */}
      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "MANAGER", "TL", "TEAM_LEAD", "TEAMLEADER", "EMPLOYEE"]} />}>
        <Route path="/mypayslips" element={<MyPayslips />} />
        <Route path="/myperformance" element={<MyPerformance />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
