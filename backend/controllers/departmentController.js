const db = require("../config/db");
const { addActivity } = require("./activityController");

/* =====================================
   CREATE DEPARTMENT
===================================== */
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const sql = "INSERT INTO departments (name, code) VALUES (?, ?)";

    const [result] = await db.execute(sql, [name, code || null]);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department: {
        id: result.insertId,
        name,
        code,
      },
    });
    await addActivity('DEPARTMENT', `New department created: <b>${name}</b>`, '#6366f1');

  } catch (error) {
    console.error("Create Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};


/* =====================================
   GET ALL DEPARTMENTS
===================================== */
exports.getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.execute(
      "SELECT * FROM departments ORDER BY id DESC"
    );

    res.status(200).json({
      success: true,
      data: departments,
    });

  } catch (error) {
    console.error("Fetch Departments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};


/* =====================================
   GET SINGLE DEPARTMENT
===================================== */
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [dept] = await db.execute(
      "SELECT * FROM departments WHERE id = ?",
      [id]
    );

    if (dept.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dept[0],
    });

  } catch (error) {
    console.error("Fetch Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching department",
    });
  }
};


/* =====================================
   UPDATE DEPARTMENT
===================================== */
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const cleanName = (name || "").trim();
    const cleanCode = (code || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const [result] = await db.execute(
      "UPDATE departments SET name = ?, code = ? WHERE id = ?",
      [cleanName, cleanCode || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
    });
    await addActivity('DEPARTMENT', `Department updated: <b>${cleanName}</b>`, '#f59e0b');

  } catch (error) {
    console.error("Update Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


/* =====================================
   DELETE DEPARTMENT
===================================== */
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      "DELETE FROM departments WHERE id = ?",
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });

  } catch (error) {
    console.error("Delete Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};
