// server/controllers/projectController.js
const { google } = require("googleapis");
const path = require("path");

// ⚙️ CONFIG: Parent "SiteSort AI" folder that contains all project folders
const PROJECTS_PARENT_ID =
  process.env.SITESORT_PARENT_ID || "1C4linCEdD24PPVWPmtFhrRXC4C9GhuPR";

// Service account key that already works in your repo
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../dark-stratum-465506-u8-6a66584f85aa.json"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

/**
 * POST /api/projects
 * body: { name: string }
 * Creates a new Drive folder under the projects parent.
 */
exports.createProject = async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // Check if a folder with the same name already exists under the parent (optional)
    const existsRes = await drive.files.list({
      q: `'${PROJECTS_PARENT_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and name='${name.replace(/'/g, "\\'")}'`,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if ((existsRes.data.files || []).length > 0) {
      return res.status(409).json({ error: "A project with this name already exists" });
    }

    const createRes = await drive.files.create({
      resource: {
        name: name.trim(),
        mimeType: "application/vnd.google-apps.folder",
        parents: [PROJECTS_PARENT_ID],
      },
      fields: "id, name, createdTime",
      supportsAllDrives: true,
    });

    return res.json({
      id: createRes.data.id,
      name: createRes.data.name,
      createdTime: createRes.data.createdTime,
    });
  } catch (error) {
    console.error("❌ Failed to create project folder:", error);
    return res.status(500).json({ error: "Unable to create project folder" });
  }
};

/**
 * GET /api/projects
 * Returns folders under the projects parent for the dropdown.
 */
exports.listProjects = async (_req, res) => {
  try {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    const response = await drive.files.list({
      q: `'${PROJECTS_PARENT_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name, createdTime)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1000,
    });

    const folders = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
    }));

    // Optional: sort newest first
    folders.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    return res.json(folders);
  } catch (error) {
    console.error("❌ Failed to list projects:", error);
    return res.status(500).json({ error: "Unable to list projects" });
  }
};

exports.getProjectStats = async (req, res) => {
  const { id } = req.params; // project folder ID

  try {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // 1. List subfolders of this project
    const subfoldersRes = await drive.files.list({
      q: `'${id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const subfolders = subfoldersRes.data.files || [];
    const rfiFolder = subfolders.find((f) => f.name.toLowerCase() === "rfi");
    const rfqFolder = subfolders.find((f) => f.name.toLowerCase() === "rfq");

    // 2. Count all files under the project (excluding trashed)
    const allFilesRes = await drive.files.list({
      q: `'${id}' in parents and trashed=false`,
      fields: "files(id)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const totalFiles = allFilesRes.data.files?.length || 0;

    // 3. Get files inside RFI folder
    let rfiFiles = [];
    if (rfiFolder) {
      const rfiRes = await drive.files.list({
        q: `'${rfiFolder.id}' in parents and trashed=false`,
        fields: "files(id, name)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      rfiFiles = rfiRes.data.files || [];
    }

    // 4. Get files inside RFQ folder
    let rfqFiles = [];
    if (rfqFolder) {
      const rfqRes = await drive.files.list({
        q: `'${rfqFolder.id}' in parents and trashed=false`,
        fields: "files(id, name)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      rfqFiles = rfqRes.data.files || [];
    }

    return res.json({
      totalFiles,
      rfiCount: rfiFiles.length,
      rfiMessages: rfiFiles.map((f) => f.name),
      rfqCount: rfqFiles.length,
      rfqMessages: rfqFiles.map((f) => f.name),
    });
  } catch (error) {
    console.error("❌ Failed to fetch project stats:", error);
    return res.status(500).json({ error: "Unable to fetch project stats" });
  }
};