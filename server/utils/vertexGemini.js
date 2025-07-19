require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { VertexAI } = require("@google-cloud/vertexai");

// Initialize Vertex AI
const vertexAI = new VertexAI({
    project: process.env.GCP_PROJECT_ID,
    location: process.env.GCP_REGION,
    keyFile: path.resolve(__dirname, process.env.GCP_KEY_PATH),
});

// Gemini 2.5 model config
const model = vertexAI.preview.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
    publisher: "google",
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
    },
});

// Token tracking system
let tokenUsageToday = 0;
const DAILY_TOKEN_CAP = parseInt(process.env.DAILY_TOKEN_CAP) || 100000;

function resetDailyTokenUsage() {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    setTimeout(() => {
        tokenUsageToday = 0;
        resetDailyTokenUsage();
    }, msUntilMidnight);
}
resetDailyTokenUsage();

function estimateTokens(text) {
    return Math.ceil(text.trim().split(/\s+/).length * 1.3);
}

// 🔍 Match only the relevant section based on keywords
function extractRelevantContext(prompt, context) {
    const sections = {
        upload: /📤 Uploading Files[\s\S]*?(?=\n📁|\n📊|\n🧭|\n👥|\n🛠|\n💡|$)/,
        search: /📁 Searching Documents[\s\S]*?(?=\n📊|\n🧭|\n👥|\n🛠|\n💡|$)/,
        dashboard: /📊 Dashboard Insights[\s\S]*?(?=\n🧭|\n👥|\n🛠|\n💡|$)/,
        help: /🧭 Help Guide[\s\S]*?(?=\n👥|\n🛠|\n💡|$)/,
        account: /👥 Account Info[\s\S]*?(?=\n🛠|\n💡|$)/,
        issues: /🛠 Common Issues[\s\S]*?(?=\n💡|$)/,
        tips: /💡 Tips[\s\S]*$/,
    };

    const lower = prompt.toLowerCase();

    if (/upload|drag.*(pdf|file|document)/.test(lower)) return context.match(sections.upload)?.[0] || context;
    if (/search|find|look.*file/.test(lower)) return context.match(sections.search)?.[0] || context;
    if (lower.includes("dashboard")) return context.match(sections.dashboard)?.[0] || context;
    if (lower.includes("account") || lower.includes("profile")) return context.match(sections.account)?.[0] || context;
    if (lower.includes("issue") || lower.includes("problem")) return context.match(sections.issues)?.[0] || context;
    if (lower.includes("tip") || lower.includes("advice")) return context.match(sections.tips)?.[0] || context;

    return context; // fallback to full
}

// 🌟 Ask Gemini
async function askGemini(prompt) {
    if (!prompt || prompt.trim().length < 2) {
        return {
            reply: "Hey there! 😊 I'm Sorta — your friendly SiteSort assistant. Need help with uploading, searching, or dashboard stuff?",
            blocked: false,
        };
    }

    const estimated = estimateTokens(prompt);
    if (tokenUsageToday + estimated > DAILY_TOKEN_CAP) {
        return {
            reply: "⚠️ SortaBot is resting today — daily AI cap reached. Try again tomorrow!",
            blocked: true,
        };
    }

    // Load knowledge and trim context
    let context = "";
    try {
        const knowledgePath = path.resolve(__dirname, "../sorta_knowledge.txt");
        const fullContext = fs.readFileSync(knowledgePath, "utf-8");
        context = extractRelevantContext(prompt, fullContext);
    } catch (err) {
        console.warn("⚠️ Could not load Sorta knowledge file:", err.message);
        context = "Sorta is a helpful AI assistant that guides users through the SiteSort platform.";
    }

    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                `You are Sorta, a helpful and casual AI assistant for the SiteSort platform.\n\n` +
                                `Here is your system knowledge:\n${context.trim()}\n\n` +
                                `User asked: "${prompt.trim()}"\n` +
                                `Answer clearly and directly using the guide above. Do NOT introduce yourself. Just give the answer.\n` +
                                `Sorta:`,
                        },
                    ],
                },
            ],
        });

        let reply = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No response";

        // 🧽 Strip unwanted intro if Gemini still misbehaves
        // Remove any redundant greeting at the start
        reply = reply.replace(/^(hi|hello|hey|greetings)[.! ]*[\s\n-]*/i, "").trim();

        // Remove "I am Sorta..." intros

        reply = reply.replace(/^i'?m (sorta|an ai assistant)[\s\S]*?(?=\n|\.|:)/i, "").trim();
        if (reply.length < 20 || /^[a-z]/.test(reply)) {
            reply = `I'm Sorta — your helpful AI assistant built into the SiteSort platform. Ask me anything about uploading, searching, or dashboard insights!`;
        }
        tokenUsageToday += estimateTokens(reply) + estimated;

        return {
            reply,
            blocked: false,
        };
    } catch (err) {
        console.error("❌ Sorta AI Error:", err.message || err);
        return {
            reply: "❌ SortaBot had a brain fart. Please try again later.",
            blocked: true,
        };
    }
}

module.exports = askGemini;
