const Log = require("../models/Log");

const logAction = async ({ userId, action, req = null, metadata = {} }) => {
  try {
    await Log.create({
      user: userId,
      action,
      metadata,
      ipAddress: req?.ip || null,
      device: req?.get("User-Agent") || null
    });
  } catch (err) {
    console.error("Logging failed:", err.message);
  }
};

module.exports = logAction;
