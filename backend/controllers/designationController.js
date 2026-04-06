const db = require("../config/db");
const { addActivity } = require("./activityController");

/* =====================================
   CREATE DESIGNATION
===================================== */
exports.createDesignation = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
    }

    const [result] = await db.execute(
      "INSERT INTO designations (name, code) VALUES (?, ?)",
      [name, code || null]
    );

    res.status(201).json({
      success: true,
      message: "Designation created successfully",
      designation: {
        id: result.insertId,
        name,
        code,
      },
    });
    await addActivity('DESIGNATION', `New designation created: <b>${name}</b>`, '#8b5cf6');

  } catch (error) {
    console.error("Create Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};


/* =====================================
   GET ALL DESIGNATIONS
===================================== */
exports.getAllDesignations = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM designations ORDER BY id DESC"
    );

    res.status(200).json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error("Fetch Designations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch designations",
    });
  }
};


/* =====================================
   GET SINGLE DESIGNATION
===================================== */
exports.getDesignationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM designations WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    console.error("Fetch Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching designation",
    });
  }
};


/* =====================================
   UPDATE DESIGNATION
===================================== */
exports.updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
    }

    await db.execute(
      "UPDATE designations SET name = ?, code = ? WHERE id = ?",
      [name, code || null, id]
    );

    res.status(200).json({
      success: true,
      message: "Designation updated successfully",
    });
    await addActivity('DESIGNATION', `Designation updated: <b>${name}</b>`, '#f59e0b');

  } catch (error) {
    console.error("Update Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


/* =====================================
   DELETE DESIGNATION
===================================== */
exports.deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      "DELETE FROM designations WHERE id = ?",
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Designation deleted successfully",
    });

  } catch (error) {
    console.error("Delete Designation Error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};