const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./uploads/policies/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (ext) {
    cb(null, true);
  } else {
    cb("Only PDF/DOC files are allowed!");
  }
};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;