const { google } = require("googleapis");
const User = require("../models/User");

async function uploadFileWithOAuth(userId, fileBuffer, filename, folderId) {
    const user = await User.findById(userId);
    if (!user || !user.googleAccessToken) throw new Error("User not linked to Google");

    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "http://localhost:3001/api/auth/google/callback"
    );

    oAuth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
    });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    const fileMetadata = {
        name: filename,
        ...(folderId && { parents: [folderId] }), // 👈 place file in selected folder
    };

    const media = {
        mimeType: "application/pdf",
        body: require("stream").Readable.from(fileBuffer),
    };

    const res = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id, name, webViewLink",
    });

    return res.data;
}


module.exports = { uploadFileWithOAuth };
