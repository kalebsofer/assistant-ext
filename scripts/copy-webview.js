const fs = require('fs');
const path = require('path');

// Create the output directory if it doesn't exist
const outDir = path.join(__dirname, '..', 'out', 'webview');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Copy webview files
const srcDir = path.join(__dirname, '..', 'src', 'webview');
['webview.html', 'webview.js'].forEach(file => {
    fs.copyFileSync(
        path.join(srcDir, file),
        path.join(outDir, file)
    );
    console.log(`Copied ${file} to out/webview/`);
}); 