const express = require("express");
const router = express.Router();
const { getTasks, addTasks, updateTask } = require("../controllers/taskController");
const auth = require("../middlewares/authMiddleware");
const Task = require("../models/Task"); // ✅ this line is missing!

router.get("/", auth, getTasks);
router.post("/", auth, addTasks);
router.put("/:id", auth, updateTask);

router.post("/bulk", auth, async (req, res) => {
    try {
        const { tasks } = req.body; // array of strings or objects
        const userId = req.user._id; // now available because auth runs

        const created = await Task.insertMany(
            tasks.map(t => ({
                description: typeof t === "string" ? t : t.description,
                userId,
            }))
        );

        res.json(created);
    } catch (err) {
        console.error("Bulk task insert failed:", err.message);
        res.status(500).json({ error: "Failed to create tasks" });
    }
});


router.delete("/all", auth, async (req, res) => {
    try {
        await Task.deleteMany({ userId: req.user._id });
        res.json({ message: "All tasks cleared" });
    } catch (err) {
        console.error("Clear tasks failed:", err.message);
        res.status(500).json({ error: "Failed to clear tasks" });
    }
});

module.exports = router;
