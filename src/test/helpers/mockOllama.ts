import * as http from 'http';

export interface MockOllamaConfig {
    port: number;
    responseDelay?: number;
    defaultResponse?: string;
}

export class MockOllamaServer {
    private server!: http.Server;
    private config: MockOllamaConfig;

    constructor(config: MockOllamaConfig) {
        this.config = config;
    }

    public async start(): Promise<void> {
        return new Promise((resolve) => {
            this.server = http.createServer((req, res) => {
                if (req.url === '/api/generate' && req.method === 'POST') {
                    setTimeout(() => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            model: 'deepseek-r1:1.5b',
                            response: this.config.defaultResponse || 'Mock response',
                            done: true
                        }));
                    }, this.config.responseDelay || 0);
                }
            });
            
            this.server.listen(this.config.port, () => resolve());
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
