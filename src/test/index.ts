import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '.');
    
    try {
        const files = await glob('suite/**/*.test.js', {
            cwd: testsRoot,
            absolute: true,
            windowsPathsNoEscape: true
        });
        
        files.forEach(f => mocha.addFile(f));

        return new Promise((resolve, reject) => {
            mocha.run((failures: number) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        throw err;
    }
} 