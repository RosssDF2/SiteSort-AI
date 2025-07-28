const multer = require("multer");

const storage = multer.memoryStorage(); // store in RAM buffer

module.exports = multer({ storage });
