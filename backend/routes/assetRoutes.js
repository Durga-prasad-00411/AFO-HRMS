const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadAsset");
const { addAsset, getAssets, updateAsset, deleteAsset, getAssetById } = require("../controllers/assetController");
const { allocateAsset } = require("../controllers/assetAllocationController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/",
  upload.single("assetImage"),
  addAsset
);

router.post(
  "/allocate",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  allocateAsset
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"),
  getAssets
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"),
  getAssetById
);

router.put(
  "/update/:id",
  upload.single("assetImage"),
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateAsset
);

router.delete(
  "/delete/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteAsset
);

module.exports = router;