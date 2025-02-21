import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIPanel } from '../../panels/AIPanel';
import { TestHelper } from '../helpers/testHelper';
import * as sinon from 'sinon';

suite('Command Test Suite', () => {
    let inputBoxStub: sinon.SinonStub;

    suiteSetup(async () => {
        TestHelper.before();
        // Activate the extension before running tests
        await vscode.extensions.getExtension('soft-assist')?.activate();
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
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('soft-assist.openAIPanel'), 'openAIPanel command should be registered');
        assert.ok(commands.includes('soft-assist.askQuestion'), 'askQuestion command should be registered');
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
