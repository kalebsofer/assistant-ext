import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

export class AIPanel {
    public static currentPanel: AIPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private static readonly _outputChannel = vscode.window.createOutputChannel('AI Assistant');
    private attachedFiles: Map<string, string> = new Map();
    private _extensionPath: string;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionPath = extensionUri.fsPath;
        AIPanel._outputChannel.appendLine('Initializing AI Assistant panel...');
        
        if (!this._panel.webview) {
            AIPanel._outputChannel.appendLine('ERROR: Webview is not available!');
            throw new Error('Webview is not available');
        }
        
        AIPanel._outputChannel.appendLine('Setting webview options...');
        this._panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        };
        
        AIPanel._outputChannel.appendLine('Setting webview HTML...');
        this._panel.webview.html = this._getWebviewContent();
        
        // Add back the dispose handler
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        AIPanel._outputChannel.appendLine('Setting up message handlers...');
        this._panel.webview.onDidReceiveMessage(
            async message => {
                AIPanel._outputChannel.appendLine(`Received message from webview: ${JSON.stringify(message)}`);
                switch (message.command) {
                    case 'askQuestion':
                        AIPanel._outputChannel.appendLine(`Processing question: ${message.text}`);
                        await this._handleQuestion(message.text);
                        break;
                    case 'pickFiles':
                        AIPanel._outputChannel.appendLine('Processing pickFiles command');
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
            },
            null,
            this._disposables
        );

        // Add error handler for the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                AIPanel._outputChannel.appendLine(`Debug: Raw webview message: ${JSON.stringify(message)}`);
            },
            undefined,
            this._disposables
        );
        
        AIPanel._outputChannel.appendLine('AI Assistant panel initialized');

        // Test message passing
        setTimeout(() => {
            AIPanel._outputChannel.appendLine('Sending test message to webview...');
            this._panel.webview.postMessage({ 
                type: 'test', 
                content: 'Extension initialized' 
            });
        }, 1000);
    }

    public static async createOrShow(extensionUri: vscode.Uri): Promise<AIPanel> {
        AIPanel._outputChannel.appendLine('Creating or showing AI panel...');

        // First, move the current active editor to the left side if it exists
        if (vscode.window.activeTextEditor) {
            // Move the active editor to the left side
            await vscode.commands.executeCommand('workbench.action.moveEditorToLeftGroup');
        }

        // Create the webview panel on the right side
        const panel = vscode.window.createWebviewPanel(
            'aiAssistantPanel',
            'AI Assistant',
            vscode.ViewColumn.Two, // This will place the panel on the right
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        AIPanel._outputChannel.appendLine('Initializing new AIPanel instance...');
        AIPanel.currentPanel = new AIPanel(panel, extensionUri);
        
        // Add error handler for the webview
        panel.webview.onDidReceiveMessage(
            message => {
                AIPanel._outputChannel.appendLine(`Debug: Webview message received in createOrShow: ${JSON.stringify(message)}`);
            },
            undefined,
            AIPanel.currentPanel._disposables
        );

        AIPanel._outputChannel.appendLine('New AI panel created and initialized');
        return AIPanel.currentPanel;
    }

    public attachFile(fileName: string, content: string) {
        this.attachedFiles.set(fileName, content);
        this._panel.webview.postMessage({ 
            type: 'fileAttached', 
            fileName: fileName 
        });
        AIPanel._outputChannel.appendLine(`Attached file: ${fileName}`);
    }

    private async _handleQuestion(question: string) {
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

            const data = await response.json() as OllamaResponse;
            const duration = Date.now() - startTime;
            AIPanel._outputChannel.appendLine(`Received response from Ollama (${duration}ms)`);
            
            AIPanel._outputChannel.appendLine(`Response content: ${JSON.stringify(data)}`);
            
            this._panel.webview.postMessage({ 
                type: 'response', 
                content: data.response 
            });
            AIPanel._outputChannel.appendLine('Response sent to webview');
        } catch (error) {
            AIPanel._outputChannel.appendLine(`Error: ${error}`);
            vscode.window.showErrorMessage('Failed to connect to Ollama: ' + error);
        }
    }

    private async _pickFiles() {
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
                } catch (error) {
                    AIPanel._outputChannel.appendLine(`Error reading file ${file.fsPath}: ${error}`);
                }
            }
        }
    }

    private _getWebviewContent() {
        AIPanel._outputChannel.appendLine('Generating webview content...');
        
        try {
            // Get path to webview html file
            const htmlPath = path.join(this._extensionPath, 'out', 'webview', 'webview.html');
            AIPanel._outputChannel.appendLine(`Loading HTML from: ${htmlPath}`);
            
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`HTML file not found at: ${htmlPath}`);
            }
            
            let html = fs.readFileSync(htmlPath, 'utf8');
            AIPanel._outputChannel.appendLine('HTML file loaded successfully');

            // Get the webview js file
            const jsPath = vscode.Uri.file(
                path.join(this._extensionPath, 'out', 'webview', 'webview.js')
            );
            const jsUri = this._panel.webview.asWebviewUri(jsPath);
            AIPanel._outputChannel.appendLine(`JS URI: ${jsUri}`);

            // Replace the script src with the correct URI
            const scriptSrc = `<script src="${jsUri}"></script>`;
            html = html.replace('<script src="webview.js"></script>', scriptSrc);
            
            AIPanel._outputChannel.appendLine('Webview content prepared');
            return html;
        } catch (error) {
            AIPanel._outputChannel.appendLine(`Error loading webview content: ${error}`);
            throw error;
        }
    }

    public dispose() {
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

    public sendMessage(message: any) {
        this._panel.webview.postMessage(message);
    }
} 