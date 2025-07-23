const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../dark-stratum-465506-u8-6a66584f85aa.json'),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

exports.createProject = async (req, res) => {
  const { name } = req.body;
  const parentId = '1C4linCEdD24PPVWPmtFhrRXC4C9GhuPR'; // SiteSort AI folder

  try {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    const response = await drive.files.create({
      resource: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id, name',
    });

    res.json({ id: response.data.id, name: response.data.name });
  } catch (error) {
    console.error("❌ Failed to create project folder:", error.message);
    res.status(500).json({ error: 'Unable to create project folder' });
  }
};

exports.listProjects = async (req, res) => {
  const parentId = '1C4linCEdD24PPVWPmtFhrRXC4C9GhuPR';

  try {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    const response = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, createdTime)',
    });

    const folders = response.data.files;
    res.json(folders); // Each is { id, name, createdTime }
  } catch (error) {
    console.error("❌ Failed to list projects:", error.message);
    res.status(500).json({ error: 'Unable to list projects' });
  }
};
