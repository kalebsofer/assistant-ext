import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIPanel } from '../../panels/AIPanel';
import { TestHelper } from '../helpers/testHelper';
import * as sinon from 'sinon';

suite('Command Test Suite', () => {
    let inputBoxStub: sinon.SinonStub;

    suiteSetup(async () => {
        TestHelper.before();
        // Wait for extension to fully activate
        const extension = vscode.extensions.getExtension('undefined_publisher.soft-assist');
        console.log('Extension found:', extension?.id);
        console.log('Extension active:', extension?.isActive);
        
        if (!extension) {
            throw new Error('Extension not found');
        }
        
        if (!extension.isActive) {
            console.log('Activating extension...');
            await extension.activate();
            console.log('Extension activated');
            // Give a small delay after activation
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    });

    setup(() => {
        // Create stub before each test
        inputBoxStub = TestHelper.createStub(vscode.window, 'showInputBox');
    });

    teardown(() => {
        // Clean up after each test
        if (AIPanel.currentPanel) {
            AIPanel.currentPanel.dispose();
        }
        // Restore original method
        inputBoxStub.restore();
    });

    test('Command Registration', async () => {
        // Get initial commands
        const commands = await vscode.commands.getCommands();
        
        // Debug: Log all commands that contain 'soft-assist' or 'ai'
        const relevantCommands = commands.filter(cmd => 
            cmd.includes('soft-assist') || cmd.includes('ai')
        );
        console.log('Available commands:', relevantCommands);
        
        // Direct assertion without waiting
        assert.ok(
            commands.includes('soft-assist.openAIPanel'), 
            `openAIPanel command should be registered. Available commands: ${relevantCommands.join(', ')}`
        );
        assert.ok(
            commands.includes('soft-assist.askQuestion'), 
            `askQuestion command should be registered. Available commands: ${relevantCommands.join(', ')}`
        );
    });

    test('Open AI Panel Command', async () => {
        await vscode.commands.executeCommand('soft-assist.openAIPanel');
        await TestHelper.waitForCondition(() => AIPanel.currentPanel !== undefined);
        assert.ok(AIPanel.currentPanel, 'Panel should be created');
    });

    test('Ask Question Command', async () => {
        const testQuestion = 'Test question';
        inputBoxStub.resolves(testQuestion);

        await vscode.commands.executeCommand('soft-assist.askQuestion');
        await TestHelper.waitForCondition(() => AIPanel.currentPanel !== undefined);
        
        assert.ok(inputBoxStub.calledOnce);
        assert.ok(AIPanel.currentPanel);
    });

    test('Ask Question Command - Cancelled', async () => {
        // Simulate user cancelling the input box by returning undefined
        inputBoxStub.resolves(undefined);

        await vscode.commands.executeCommand('soft-assist.askQuestion');
        
        // Wait to ensure no panel is created
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify panel was not created when user cancelled
        assert.strictEqual(
            AIPanel.currentPanel,
            undefined,
            'Panel should not be created when input is cancelled'
        );
    });
});
