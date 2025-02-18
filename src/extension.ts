// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AIPanel } from './panels/AIPanel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('AI Assistant extension is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let openAIPanelCommand = vscode.commands.registerCommand('kscodes.openAIPanel', () => {
		AIPanel.createOrShow(context.extensionUri);
	});

	let askQuestionCommand = vscode.commands.registerCommand('kscodes.askQuestion', async () => {
		const question = await vscode.window.showInputBox({
			prompt: 'What would you like to ask?',
			placeHolder: 'Enter your question...'
		});

		if (question) {
			AIPanel.createOrShow(context.extensionUri);
			// The panel will handle the question
		}
	});

	context.subscriptions.push(openAIPanelCommand, askQuestionCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
