const { google } = require('googleapis');
const path = require('path');

// Load service account key
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'dark-stratum-465506-u8-6a66584f85aa.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

async function createFolder() {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    const folderMetadata = {
        name: 'Test Folder From Node',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['1C4linCEdD24PPVWPmtFhrRXC4C9GhuPR'] // 👈 replace this
    };


    try {
        const response = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, name',
        });

        console.log('✅ Folder created:');
        console.log('Name:', response.data.name);
        console.log('ID:', response.data.id);
    } catch (error) {
        console.error('❌ Error creating folder:', error.message);
    }
}

createFolder();
