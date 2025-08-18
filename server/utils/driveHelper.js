// server/utils/driveHelper.js
const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../keys/firman.json"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

/**
 * Recursively list all files under a folder (including in subfolders).
 * Returns: [{ id, name, mimeType, parents? }, ...]
 */
async function listAllFilesRecursive(folderId) {
  const authClient = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: authClient });

  const allFiles = [];

  async function listFilesInFolder(fid) {
    // List immediate children
    const res = await drive.files.list({
      q: `'${fid}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, parents, modifiedTime)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1000,
    });

    for (const file of res.data.files || []) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        // Recurse into subfolder
        await listFilesInFolder(file.id);
      } else {
        allFiles.push(file);
      }
    }
  }

  await listFilesInFolder(folderId);
  return allFiles;
}

module.exports = { listAllFilesRecursive };
