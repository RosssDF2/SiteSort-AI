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

// 🌟 Ask Gemini (main chatbot use)
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

        reply = reply.replace(/^(hi|hello|hey|greetings)[.! ]*[\s\n-]*/i, "").trim();
        reply = reply.replace(/^i'?m (sorta|an ai assistant)[\s\S]*?(?=\n|\.|:)/i, "").trim();
        if (reply.length < 20 || /^[a-z]/.test(reply)) {
            reply = `I'm Sorta — your helpful AI assistant built into the SiteSort platform. Ask me anything about uploading, searching, or dashboard insights!`;
        }
        let imageHint = null;
        if (/upload/i.test(prompt)) {
            imageHint = "/images/sorta-help/upload-guide.png";
        }
        if (imageHint) {
            reply += `\n\n🖼️ Here's a visual guide:\n![Upload Guide](${imageHint})`;
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

// 🧾 Budget JSON generator
async function generateBudgetJSON(prompt) {
    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text;
    } catch (err) {
        console.error("❌ Gemini Budget JSON error:", err.message);
        throw err;
    }
}

/**
 * Summarizes plain text extracted from PDF or text files.
 * @param {string} extractedText - Cleaned, readable text content
 * @param {string} filename - Original filename for context
 */
async function summarizeDocumentBuffer(extractedText, filename) {
    try {
        const prompt = `
You're a helpful assistant that reads internal project documents like budgets and reports.

Summarize the document titled "${filename}" in a **short, clear, and bullet-point format**, as if you're updating a project manager.

Focus only on:
- Budget figures
- Key observations
- Action items (if any)

Be concise and skip generic intros. Just give the important points.

Document:
${extractedText}
        `.trim();

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "No summary available.";
    } catch (err) {
        console.error("❌ Gemini summarization error:", err.message);
        return "❌ Failed to summarize file.";
    }
}

// 🌟 Ask Gemini (Zara's version for SiteSort AI)
async function askSiteSortAI(prompt) {
    if (!prompt || prompt.trim().length < 2) {
        return {
            reply: "Hello! I'm SiteSort AI — ready to help with your files, insights, and questions.",
            blocked: false,
        };
    }

    const estimated = estimateTokens(prompt);
    if (tokenUsageToday + estimated > DAILY_TOKEN_CAP) {
        return {
            reply: "⚠️ SiteSort AI has reached today's usage cap. Please try again tomorrow!",
            blocked: true,
        };
    }

    let context = "";
    try {
        const knowledgePath = path.resolve(__dirname, "../sitesort_knowledge.txt"); // You can create a separate file for this AI if needed
        const fullContext = fs.readFileSync(knowledgePath, "utf-8");
        context = extractRelevantContext(prompt, fullContext);
    } catch (err) {
        console.warn("⚠️ Could not load SiteSort AI knowledge file:", err.message);
        context = "SiteSort AI is a powerful assistant built to help project teams manage and understand their documents with smart summaries, file search, and data insights.";
    }

    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                `You are SiteSort AI, a smart assistant that helps construction and project teams understand files, reports, and documents.\n\n` +
                                `Here is your knowledge:\n${context.trim()}\n\n` +
                                `User asked: "${prompt.trim()}"\n` +
                                `Respond with clear and professional answers. No intros, just give the useful answer.\n` +
                                `SiteSort AI:`,
                        },
                    ],
                },
            ],
        });

        let reply = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No response.";

        // Cleanup greeting/intros if AI ignores instruction
        reply = reply.replace(/^(hi|hello|hey|greetings)[.! ]*[\s\n-]*/i, "").trim();
        reply = reply.replace(/^i'?m (sitesort ai|an ai assistant)[\s\S]*?(?=\n|\.|:)/i, "").trim();

        if (reply.length < 20 || /^[a-z]/.test(reply)) {
            reply = `I'm SiteSort AI — your assistant for navigating project data, reports, and insights. How can I help today?`;
        }

        tokenUsageToday += estimateTokens(reply) + estimated;

        return {
            reply,
            blocked: false,
        };
    } catch (err) {
        console.error("❌ SiteSort AI Error:", err.message || err);
        return {
            reply: "❌ SiteSort AI ran into an issue. Try again later.",
            blocked: true,
        };
    }
}
module.exports = {
    askGemini, // Sorta
    askSiteSortAI, // 🔥 New!
    generateBudgetJSON,
    summarizeDocumentBuffer,
};
