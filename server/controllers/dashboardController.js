// server/controllers/dashboardController.js
const File = require("../models/File");
const { generateAIInsight } = require("../services/openaiService"); // optional

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const files = await File.find({ uploadedBy: userId });

        const totalFiles = files.length;
        const folderCounts = {};
        const rfiCountThisWeek = files.filter(f => f.originalName.includes("RFI") && isThisWeek(f.uploadedAt)).length;

        files.forEach(f => {
            const folder = f.folder || "Unsorted";
            folderCounts[folder] = (folderCounts[folder] || 0) + 1;
        });

        const topFolders = Object.entries(folderCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const aiInsight = await generateAIInsight(files); // optional

        const { search, type } = req.query;

        if (search) {
            docs = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
        }
        if (type) {
            docs = docs.filter(d => d.type === type);
        }


        res.json({ totalFiles, rfiCountThisWeek, topFolders, aiInsight });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

function isThisWeek(date) {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return new Date(date) >= startOfWeek;
}
