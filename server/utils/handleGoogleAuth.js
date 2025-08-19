const User = require('../models/User');

async function handleGoogleAuthError(error, user) {
    if (error.message === 'invalid_grant' || 
        (error.response?.data?.error === 'invalid_grant')) {
        
        // Clear invalid tokens
        user.googleAccessToken = undefined;
        user.googleRefreshToken = undefined;
        user.isGoogleLinked = false;
        await user.save();
        
        return {
            error: 'google_auth_required',
            message: 'Your Google access has expired. Please reconnect your Google account.',
            requiresReauth: true
        };
    }
    
    return {
        error: 'google_error',
        message: 'An error occurred while accessing Google Drive',
        requiresReauth: false
    };
}

module.exports = { handleGoogleAuthError };
