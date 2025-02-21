import * as sinon from 'sinon';
import * as vscode from 'vscode';

export class TestHelper {
    private static sandbox: sinon.SinonSandbox;

    static before() {
        this.sandbox = sinon.createSandbox();
    }

    static after() {
        this.sandbox.restore();
    }

    static createStub<T extends object>(obj: T, method: keyof T) {
        return this.sandbox.stub(obj, method);
    }

    static async waitForCondition(condition: () => boolean, timeout = 2000): Promise<void> {
        const start = Date.now();
        while (!condition()) {
            if (Date.now() - start > timeout) {
                throw new Error('Timeout waiting for condition');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
} 