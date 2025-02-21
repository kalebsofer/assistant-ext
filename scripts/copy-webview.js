const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out', 'webview');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const srcDir = path.join(__dirname, '..', 'src', 'webview');
const files = [
    'webview.html',
    'webview.js',
    'statusView.html'
];
files.forEach(file => {
    fs.copyFileSync(
        path.join(srcDir, file),
        path.join(outDir, file)
    );
    console.log(`Copied ${file} to out/webview/`);
}); 