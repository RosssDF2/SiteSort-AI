const { google } = require("googleapis");
const User = require("../models/User");

const listFoldersFromUserDrive = async (req, res) => {
  try {
    const parentIdFromQuery = req.query.parentId;

    // 1. Verify user from JWT
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized: No user ID found in token." });
    }

    // 2. Fetch user from DB
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.googleAccessToken) {
      return res.status(403).json({ error: "Google account not linked." });
    }

    // 3. Setup OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken || undefined,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 4. Get SiteSort AI root folder (only if parentId not passed)
    let parentId = parentIdFromQuery;
    if (!parentId) {
      const rootFolderRes = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and name='SiteSort AI' and trashed=false",
        fields: "files(id, name)",
        spaces: "drive",
      });

      if (!rootFolderRes.data.files.length) {
        return res.status(404).json({ error: "Root folder 'SiteSort AI' not found in Google Drive." });
      }

      parentId = rootFolderRes.data.files[0].id;
    }

    // 5. List all folders inside parentId
    const subfolderRes = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    res.json({
      parentId,
      folders: subfolderRes.data.files,
    });
  } catch (err) {
    console.error("🔴 Failed to list folders:", err.message || err);
    res.status(500).json({ error: "Failed to list folders from Google Drive." });
  }
};

module.exports = listFoldersFromUserDrive;
