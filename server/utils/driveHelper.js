const { google } = require("googleapis");
const path = require("path");

// Auth using your existing JSON
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../keys/firman.json"), // double-check your path
  scopes: ["https://www.googleapis.com/auth/drive"]
});

// Main function: recursively list all files in folder + subfolders
async function listAllFilesRecursive(folderId) {
  const authClient = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: authClient });

  let allFiles = [];

  async function listFilesInFolder(folderId) {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
    });

    for (const file of res.data.files) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        // 📂 If folder, recurse
        await listFilesInFolder(file.id);
      } else {
        // 📄 It's a file
        allFiles.push(file);
      }
    }
  }

  await listFilesInFolder(folderId);
  return allFiles;
}

module.exports = { listAllFilesRecursive };
