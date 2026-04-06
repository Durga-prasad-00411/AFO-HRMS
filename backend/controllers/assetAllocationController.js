const db = require("../config/db");

exports.allocateAsset = async (req, res) => {
    console.log("Allocate API hit");
    console.log("Request Body:", req.body);

    const rawEmployeeId = req.body.employeeId;
    const rawAssetId = req.body.assetId;
    const rawAssetType = req.body.assetType;
    const rawAllocationDateTime = req.body.allocationDateTime;
    const condition = req.body.condition;
    const description = req.body.description;

    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim() : "";
    const assetId = rawAssetId ? String(rawAssetId).trim() : "";
    const assetType = rawAssetType ? String(rawAssetType).trim() : "";
    const allocationDateTime = rawAllocationDateTime
        ? String(rawAllocationDateTime).replace("T", " ").length === 16
            ? String(rawAllocationDateTime).replace("T", " ") + ":00"
            : String(rawAllocationDateTime).replace("T", " ")
        : "";

    if (!employeeId || !allocationDateTime || (!assetId && !assetType)) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    try {
        // 1️⃣ Check Employee Exists
        const employeeQuery = `
            SELECT id
            FROM employees
            WHERE employee_code = ?
               OR id = ?
               OR user_id = ?
            LIMIT 1
        `;
        const [empResult] = await db.execute(employeeQuery, [employeeId, employeeId, employeeId]);

        if (empResult.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const empDbId = empResult[0].id;

        // 2️⃣ Get Asset ID using exact ID if provided, or fallback to any unallocated asset_type
        let assetDbId;

        if (assetId) {
            const assetQuery = "SELECT id FROM assets WHERE id = ? AND id NOT IN (SELECT asset_id FROM asset_allocations)";
            const [assetResult] = await db.execute(assetQuery, [assetId]);
            if (assetResult.length === 0) {
                return res.status(404).json({ message: "Asset not found or already allocated" });
            }
            assetDbId = assetResult[0].id;
        } else {
            const assetQuery = "SELECT id FROM assets WHERE asset_type = ? AND id NOT IN (SELECT asset_id FROM asset_allocations) LIMIT 1";
            const [assetResult] = await db.execute(assetQuery, [assetType]);

            if (assetResult.length === 0) {
                return res.status(404).json({ message: "No unallocated asset of this type found" });
            }

            assetDbId = assetResult[0].id;
        }

        // 3️⃣ Insert Allocation
        const insertQuery = `
      INSERT INTO asset_allocations
      (asset_id, employee_id, allocation_datetime, asset_condition, description)
      VALUES (?, ?, ?, ?, ?)
    `;

        const [result] = await db.execute(insertQuery, [
            assetDbId,
            empDbId,
            allocationDateTime,
            condition || null,
            description || null,
        ]);

        return res.status(201).json({
            success: true,
            message: "Asset allocated successfully",
            id: result.insertId,
        });
    } catch (error) {
        console.error("Allocation Error:", error);
        return res.status(500).json({ message: "Database or Allocation error" });
    }
};
