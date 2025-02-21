const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const vscodePath = path.join(__dirname, '..', '.vscode-test');

// Force close any open handles
if (process.platform === 'win32') {
    try {
        // Give time for any processes to release handles
        setTimeout(() => {
            rimraf.sync(vscodePath, { 
                force: true,  // Force removal even if files are locked
                maxRetries: 3,
                recursive: true
            });
        }, 1000);
    } catch (err) {
        console.warn('Warning: Could not fully clean .vscode-test directory:', err.message);
        // Continue even if cleanup fails
    }
} else {
    rimraf.sync(vscodePath);
} 