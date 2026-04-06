const db = require("../config/db");
const { addActivity } = require("./activityController");


// ================= ADD ASSET =================
exports.addAsset = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      assetName,
      assetType,
      location,
      description,
      accountNumber,
      purchaseDate,
      price,
    } = req.body;

    if (
      !assetName ||
      !assetType ||
      !location ||
      !accountNumber ||
      !purchaseDate ||
      !price
    ) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    const image = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO assets
      (asset_name, asset_type, location, description, account_number, purchase_date, price, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      assetName,
      assetType,
      location,
      description || null,
      accountNumber,
      purchaseDate,
      price,
      image,
    ]);

    await addActivity('ASSET', `New asset added: <b>${assetName}</b>`, '#06b6d4');

    return res.status(201).json({
      success: true,
      message: "Asset stored successfully",
    });

  } catch (error) {
    console.error("ADD ASSET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= GET ALL ASSETS =================
exports.getAssets = async (req, res) => {
  try {

    const [rows] = await db.execute(`
      SELECT 
        assets.id,
        assets.asset_name,
        assets.asset_type,
        assets.image,
        CONCAT(employees.first_name, ' ', employees.last_name) AS allocatedTo,
        assets.location,
        assets.price,
        assets.purchase_date,
        assets.description,
        assets.account_number,
        assets.created_at,
        assets.updated_at

      FROM assets

      LEFT JOIN asset_allocations
        ON assets.id = asset_allocations.asset_id

      LEFT JOIN employees
        ON asset_allocations.employee_id = employees.id

      ORDER BY assets.id ASC
    `);

    return res.status(200).json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error("GET ASSETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching assets",
      error: error.message,
    });
  }
};

// ================= GET ASSET BY ID =================
exports.getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`
      SELECT * FROM assets WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("GET ASSET BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ================= DELETE ASSET =================
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM assets WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    return res.status(200).json({
      message: "Asset deleted successfully",
    });

  } catch (error) {
    console.error("DELETE ASSET ERROR:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= UPDATE ASSET =================
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { assetName, assetType, location, description, accountNumber, purchaseDate, price } = req.body;

    if (!assetName || !assetType || !location || !accountNumber || !purchaseDate || !price) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const image = req.file ? req.file.filename : null;

    let sql = `
      UPDATE assets
      SET asset_name = ?, asset_type = ?, location = ?, description = ?, account_number = ?, purchase_date = ?, price = ?
    `;

    const params = [assetName, assetType, location, description, accountNumber, purchaseDate, price];

    if (image) {
      sql += `, image = ?`;
      params.push(image);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await db.execute(sql, params);

    await addActivity('ASSET', `Asset updated: <b>${assetName}</b>`, '#f59e0b');

    return res.status(200).json({ success: true, message: "Asset updated successfully" });

  } catch (error) {
    console.error("UPDATE ASSET ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};