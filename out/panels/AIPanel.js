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
class AIPanel {
    static currentPanel;
    _panel;
    _disposables = [];
    static _outputChannel = vscode.window.createOutputChannel('AI Assistant');
    attachedFiles = new Map();
    constructor(panel, extensionUri) {
        this._panel = panel;
        AIPanel._outputChannel.appendLine('Initializing AI Assistant panel...');
        this._panel.webview.html = this._getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'askQuestion':
                    AIPanel._outputChannel.appendLine(`Received question: ${message.text}`);
                    await this._handleQuestion(message.text);
                    break;
                case 'pickFiles':
                    await this._pickFiles();
                    break;
                case 'removeFile':
                    this.attachedFiles.delete(message.fileName);
                    AIPanel._outputChannel.appendLine(`Removed file: ${message.fileName}`);
                    break;
            }
        }, null, this._disposables);
        AIPanel._outputChannel.appendLine('AI Assistant panel initialized');
    }
    static createOrShow(extensionUri) {
        AIPanel._outputChannel.appendLine('Creating or showing AI panel...');
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (AIPanel.currentPanel) {
            AIPanel._outputChannel.appendLine('Reusing existing panel');
            AIPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('aiAssistantPanel', 'AI Assistant', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        AIPanel.currentPanel = new AIPanel(panel, extensionUri);
        AIPanel._outputChannel.appendLine('New AI panel created');
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
            // Prepare context from attached files
            let context = '';
            this.attachedFiles.forEach((content, fileName) => {
                context += `File: ${fileName}\n\`\`\`\n${content}\n\`\`\`\n\n`;
            });
            // Add context to the prompt if there are attached files
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
            AIPanel._outputChannel.appendLine(`Received response from Ollama (${duration}ms)`);
            AIPanel._outputChannel.appendLine(`Response content: ${JSON.stringify(data)}`);
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
        return /*html*/ `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        padding: 10px; 
                        color: var(--vscode-editor-foreground);
                        font-family: var(--vscode-font-family);
                    }
                    #chat-container { 
                        height: 70vh; 
                        overflow-y: auto; 
                        margin-bottom: 60px;
                    }
                    .message { 
                        margin: 10px 0; 
                        padding: 10px; 
                        border-radius: 5px; 
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    .user-message { 
                        background: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                    }
                    .ai-message { 
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-editor-lineHighlightBorder);
                    }
                    #input-container { 
                        position: fixed; 
                        bottom: 20px; 
                        left: 20px; 
                        right: 20px;
                        background: var(--vscode-editor-background);
                        padding: 10px 0;
                        display: flex;
                        gap: 8px;
                    }
                    #question-input { 
                        flex-grow: 1;
                        padding: 8px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                    }
                    #add-context-btn {
                        padding: 8px 12px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    #add-context-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    #attached-files {
                        margin: 10px 0;
                        padding: 5px;
                        border-bottom: 1px solid var(--vscode-input-border);
                        display: flex;
                        flex-wrap: wrap;
                        gap: 4px;
                    }
                    .file-tag {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 0.9em;
                    }
                    .file-tag button {
                        border: none;
                        background: none;
                        color: inherit;
                        padding: 0 2px;
                        cursor: pointer;
                        opacity: 0.7;
                    }
                    .file-tag button:hover {
                        opacity: 1;
                    }
                    #send-btn {
                        padding: 8px 12px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                    }
                    #send-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div id="attached-files"></div>
                <div id="chat-container"></div>
                <div id="input-container">
                    <button id="add-context-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path fill="currentColor" d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z"/>
                        </svg>
                        Add context
                    </button>
                    <input type="text" id="question-input" placeholder="Ask a question...">
                    <button id="send-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path fill="currentColor" d="M1 9l14-4.5L1 0v3.5L11 4.5 1 5.5z"/>
                        </svg>
                    </button>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById('chat-container');
                    const questionInput = document.getElementById('question-input');
                    const addContextBtn = document.getElementById('add-context-btn');
                    const sendBtn = document.getElementById('send-btn');
                    const attachedFilesDiv = document.getElementById('attached-files');
                    const attachedFiles = new Set();

                    // Add initial message
                    addMessage('ai', 'Assistant is ready. How can I help you?');

                    addContextBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'pickFiles' });
                    });

                    function sendMessage() {
                        const question = questionInput.value;
                        if (question.trim()) {
                            addMessage('user', question);
                            vscode.postMessage({ command: 'askQuestion', text: question });
                            questionInput.value = '';
                        }
                    }

                    // Add send button click handler
                    sendBtn.addEventListener('click', sendMessage);

                    // Keep enter key functionality
                    questionInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        console.log('Received message:', message);
                        switch (message.type) {
                            case 'response':
                                if (message.content) {
                                    addMessage('ai', message.content);
                                } else {
                                    addMessage('ai', 'Received empty response from AI');
                                }
                                break;
                            case 'fileAttached':
                                attachedFiles.add(message.fileName);
                                updateAttachedFiles();
                                break;
                        }
                    });

                    function updateAttachedFiles() {
                        attachedFilesDiv.innerHTML = '';
                        attachedFiles.forEach(file => {
                            const fileTag = document.createElement('div');
                            fileTag.className = 'file-tag';
                            const fileName = file.split(/[\\/]/).pop();
                            fileTag.innerHTML = \
                                \${fileName}
                                <button onclick="removeFile('\${file}')" title="Remove file">×</button>
                            \;
                            attachedFilesDiv.appendChild(fileTag);
                        });
                    }

                    function removeFile(file) {
                        attachedFiles.delete(file);
                        updateAttachedFiles();
                        vscode.postMessage({ command: 'removeFile', fileName: file });
                    }

                    function addMessage(type, content) {
                        console.log('Adding message:', type, content);
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \message \${type}-message\;
                        messageDiv.textContent = content;
                        chatContainer.appendChild(messageDiv);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                </script>
            </body>
            </html>
        `;
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
}
exports.AIPanel = AIPanel;
//# sourceMappingURL=AIPanel.js.map