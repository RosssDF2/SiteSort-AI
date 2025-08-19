const { google } = require("googleapis");
const User = require("../models/User");

async function getGoogleAuthClient(user) {
    if (!user || !user.googleAccessToken) {
        throw new Error("User not linked to Google");
    }

    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/auth/google/callback"
    );

    oAuth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
    });

    // Set up token refresh handler
    oAuth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
        }
        if (tokens.access_token) {
            user.googleAccessToken = tokens.access_token;
        }
        await user.save();
    });

    // Force token refresh if we have a refresh token
    if (user.googleRefreshToken) {
        try {
            const { tokens } = await oAuth2Client.refreshAccessToken();
            user.googleAccessToken = tokens.access_token;
            if (tokens.refresh_token) {
                user.googleRefreshToken = tokens.refresh_token;
            }
            await user.save();
            oAuth2Client.setCredentials(tokens);
        } catch (error) {
            if (error.message === 'invalid_grant') {
                // Clear invalid tokens
                user.googleAccessToken = undefined;
                user.googleRefreshToken = undefined;
                user.isGoogleLinked = false;
                await user.save();
                throw {
                    error: 'google_auth_required',
                    message: 'Your Google access has expired. Please reconnect your Google account.',
                    requiresReauth: true
                };
            }
            throw error;
        }
    }

    return oAuth2Client;
}

module.exports = { getGoogleAuthClient };
