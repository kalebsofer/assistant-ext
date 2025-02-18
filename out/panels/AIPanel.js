"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIPanel = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class AIPanel {
    static currentPanel;
    _panel;
    _disposables = [];
    static _outputChannel = vscode.window.createOutputChannel('AI Assistant');
    attachedFiles = new Map();
    _extensionPath;
    constructor(panel, extensionUri) {
        this._panel = panel;
        this._extensionPath = extensionUri.fsPath;
        AIPanel._outputChannel.appendLine('Initializing AI Assistant panel...');
        if (!this._panel.webview) {
            throw new Error('Webview is not available');
        }
        this._panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        };
        this._panel.webview.html = this._getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'askQuestion':
                    AIPanel._outputChannel.appendLine(`Processing question: ${message.text}`);
                    await this._handleQuestion(message.text);
                    break;
                case 'pickFiles':
                    await this._pickFiles();
                    break;
                case 'removeFile':
                    AIPanel._outputChannel.appendLine(`Processing removeFile: ${message.fileName}`);
                    this.attachedFiles.delete(message.fileName);
                    break;
                case 'clearFiles':
                    AIPanel._outputChannel.appendLine('Clearing all attached files');
                    this.attachedFiles.clear();
                    break;
            }
        }, null, this._disposables);
    }
    static async createOrShow(extensionUri) {
        AIPanel._outputChannel.appendLine('Creating or showing AI panel...');
        // First, move the current active editor to the left side if it exists
        if (vscode.window.activeTextEditor) {
            // Move the active editor to the left side
            await vscode.commands.executeCommand('workbench.action.moveEditorToLeftGroup');
        }
        // Create the webview panel on the right side
        const panel = vscode.window.createWebviewPanel('aiAssistantPanel', 'AI Assistant', vscode.ViewColumn.Two, // This will place the panel on the right
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        AIPanel._outputChannel.appendLine('Initializing new AIPanel instance...');
        AIPanel.currentPanel = new AIPanel(panel, extensionUri);
        // Add error handler for the webview
        panel.webview.onDidReceiveMessage(message => {
            AIPanel._outputChannel.appendLine(`Debug: Webview message received in createOrShow: ${JSON.stringify(message)}`);
        }, undefined, AIPanel.currentPanel._disposables);
        AIPanel._outputChannel.appendLine('New AI panel created and initialized');
        return AIPanel.currentPanel;
    }
    attachFile(fileName, content) {
        this.attachedFiles.set(fileName, content);
        this._panel.webview.postMessage({
            type: 'fileAttached',
            fileName: fileName
        });
        AIPanel._outputChannel.appendLine(`Attached file: ${fileName}`);
    }
    async _handleQuestion(question) {
        try {
            AIPanel._outputChannel.appendLine('Sending request to Ollama...');
            const startTime = Date.now();
            let context = '';
            this.attachedFiles.forEach((content, fileName) => {
                context += `File: ${fileName}\n\`\`\`\n${content}\n\`\`\`\n\n`;
            });
            const fullPrompt = this.attachedFiles.size > 0
                ? `Context:\n${context}\nQuestion: ${question}`
                : question;
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'deepseek-r1:1.5b',
                    prompt: fullPrompt,
                    stream: false,
                }),
            });
            const data = await response.json();
            const duration = Date.now() - startTime;
            AIPanel._outputChannel.appendLine(`Request completed in ${duration}ms`);
            this._panel.webview.postMessage({
                type: 'response',
                content: data.response
            });
            AIPanel._outputChannel.appendLine('Response sent to webview');
        }
        catch (error) {
            AIPanel._outputChannel.appendLine(`Error: ${error}`);
            vscode.window.showErrorMessage('Failed to connect to Ollama: ' + error);
        }
    }
    async _pickFiles() {
        const files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: 'Add to Context',
            filters: {
                'All Files': ['*']
            }
        });
        if (files) {
            for (const file of files) {
                try {
                    const content = await vscode.workspace.fs.readFile(file);
                    const decoder = new TextDecoder();
                    this.attachFile(file.fsPath, decoder.decode(content));
                }
                catch (error) {
                    AIPanel._outputChannel.appendLine(`Error reading file ${file.fsPath}: ${error}`);
                }
            }
        }
    }
    _getWebviewContent() {
        try {
            const htmlPath = path.join(this._extensionPath, 'out', 'webview', 'webview.html');
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`HTML file not found at: ${htmlPath}`);
            }
            let html = fs.readFileSync(htmlPath, 'utf8');
            // Get the webview js file
            const jsPath = vscode.Uri.file(path.join(this._extensionPath, 'out', 'webview', 'webview.js'));
            const jsUri = this._panel.webview.asWebviewUri(jsPath);
            // Replace the script src with the correct URI
            const scriptSrc = `<script src="${jsUri}"></script>`;
            html = html.replace('<script src="webview.js"></script>', scriptSrc);
            return html;
        }
        catch (error) {
            AIPanel._outputChannel.appendLine(`Error loading webview content: ${error}`);
            throw error;
        }
    }
    dispose() {
        AIPanel._outputChannel.appendLine('Disposing AI panel...');
        AIPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        AIPanel._outputChannel.appendLine('AI panel disposed');
    }
    sendMessage(message) {
        this._panel.webview.postMessage(message);
    }
}
exports.AIPanel = AIPanel;
