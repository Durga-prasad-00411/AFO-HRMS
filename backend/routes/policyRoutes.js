const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");
const upload = require("../middleware/uploadPolicy");


router.post("/", upload.single("policyDocument"), policyController.addPolicy);
router.post("/create", upload.single("policyDocument"), policyController.addPolicy);


// READ ALL
router.get("/", policyController.getAllPolicies);

// READ SINGLE
router.get("/:id", policyController.getPolicyById);

// UPDATE
router.put("/:id", upload.single("policyDocument"), policyController.updatePolicy);

// DELETE
router.delete("/:id", policyController.deletePolicy);


module.exports = router;
