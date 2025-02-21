const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const vscodePath = path.join(__dirname, '..', '.vscode-test');

if (process.platform === 'win32') {
    try {
        setTimeout(() => {
            rimraf.sync(vscodePath, { 
                force: true,
                maxRetries: 3,
                recursive: true
            });
        }, 1000);
    } catch (err) {
        console.warn('Warning: Could not fully clean .vscode-test directory:', err.message);
    }
} else {
    rimraf.sync(vscodePath);
} 