const { google } = require("googleapis");
const User = require("../models/User");
const { getGoogleAuthClient } = require("./googleAuthHelper");

async function uploadFileWithOAuth(userId, fileBuffer, filename, folderId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const oAuth2Client = await getGoogleAuthClient(user);

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
