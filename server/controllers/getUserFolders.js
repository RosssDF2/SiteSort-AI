const { google } = require("googleapis");

exports.getUserDriveFolders = async (req, res) => {
    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: req.user.googleAccessToken });

        const drive = google.drive({ version: "v3", auth });

        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: "files(id, name)",
        });

        const folders = response.data.files;
        res.json({ folders });
    } catch (err) {
        console.error("❌ Failed to fetch folders:", err.message);
        res.status(500).json({ error: "Failed to fetch Google Drive folders" });
    }
};

exports.getUserFolders = async (req, res) => {
    try {
        const authClient = new google.auth.OAuth2();
        authClient.setCredentials({
            access_token: req.user.googleAccessToken
        });

        const drive = google.drive({ version: "v3", auth: authClient });

        const folders = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
            fields: "files(id, name)",
            pageSize: 100,
        });

        res.json({ folders: folders.data.files });
    } catch (err) {
        console.error("❌ Folder fetch failed:", err.message);
        res.status(500).json({ error: "Failed to fetch folders" });
    }
};