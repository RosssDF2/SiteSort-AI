// utils/driveUpload.js
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../dark-stratum-465506-u8-6a66584f85aa.json"),
  scopes: ["https://www.googleapis.com/auth/drive"]
});

async function uploadFileToDrive(buffer, originalName, folderId) {
  const authClient = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: authClient });

  const fileMetadata = {
    name: originalName,
    parents: [folderId]
  };

  const media = {
    mimeType: "application/pdf", // or detect dynamically
    body: buffer
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, name, webViewLink"
  });

  return response.data;
}

module.exports = uploadFileToDrive;
