import * as vscode from 'vscode';
import { AIPanel } from './panels/AIPanel';

export function activate(context: vscode.ExtensionContext) {

	console.log('AI Assistant extension is now active!');

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

	context.subscriptions.push(openAIPanelCommand, askQuestionCommand);
}

export function deactivate() {}
