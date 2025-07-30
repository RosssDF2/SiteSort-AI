const { google } = require("googleapis");
const User = require("../models/User");

const listFoldersFromUserDrive = async (req, res) => {
  try {
    // Check if JWT decoded user exists
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized: No user ID found in token." });
    }

    // Fetch full user from MongoDB
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const accessToken = user.googleAccessToken;
    const refreshToken = user.googleRefreshToken;

    if (!accessToken) {
      return res.status(403).json({ error: "Google account not linked." });
    }

    // Set up OAuth2 client with access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined, // optional, in case you want auto-refresh
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name)",
    });

    res.json({ folders: response.data.files });
  } catch (err) {
    console.error("🔴 Failed to list Google Drive folders:", err.message || err);
    res.status(500).json({ error: "Failed to list folders from Google Drive." });
  }
};

module.exports = listFoldersFromUserDrive;
