import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AIPanel } from './panels/AIPanel';

function getStatusViewContent(extensionPath: string): string {
	const htmlPath = path.join(extensionPath, 'out', 'webview', 'statusView.html');
	return fs.readFileSync(htmlPath, 'utf8');
}

export function activate(context: vscode.ExtensionContext) {
	console.log('AI Assistant extension is now active!');

	const provider = vscode.window.registerWebviewViewProvider('ai-assistant-view', {
		resolveWebviewView: (webviewView) => {
			webviewView.webview.options = {
				enableScripts: true
			};
			webviewView.webview.html = getStatusViewContent(context.extensionUri.fsPath);

			webviewView.onDidChangeVisibility(() => {
				if (webviewView.visible && (!AIPanel.currentPanel || !AIPanel.currentPanel.isVisible())) {
					AIPanel.createOrShow(context.extensionUri);
					vscode.commands.executeCommand('workbench.action.focusSecondSideBar');
				}
			});
		}
	});

	let openAIPanelCommand = vscode.commands.registerCommand('soft-assist.openAIPanel', () => {
		AIPanel.createOrShow(context.extensionUri);
	});

	let askQuestionCommand = vscode.commands.registerCommand('soft-assist.askQuestion', async () => {
		const question = await vscode.window.showInputBox({
			prompt: 'What would you like to ask?',
			placeHolder: 'Enter your question...'
		});

		if (question) {
			const panel = await AIPanel.createOrShow(context.extensionUri);
			panel.sendMessage({ 
				type: 'response',
				content: question 
			});
		}
	});

	// When the extension activates, open the AI Panel in the secondary sidebar
	AIPanel.createOrShow(context.extensionUri);
	vscode.commands.executeCommand('workbench.action.focusSecondSideBar');

	context.subscriptions.push(provider, openAIPanelCommand, askQuestionCommand);
}

export function deactivate() {}
