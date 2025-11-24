import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { validateImage } from '../utils/validation';

const execAsync = promisify(exec);

interface PooledContainer {
    id: string;
    language: string;
    image: string;
    createdAt: number;
    lastUsed: number;
}

class ContainerPool {
    private pools: Map<string, PooledContainer[]> = new Map();
    private maxPoolSize = 3;
    private containerTTL = 5 * 60 * 1000;
    private cleanupInterval = 60 * 1000;

    constructor() {
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }

    async getContainer(language: string, image: string): Promise<string | null> {
        const poolKey = `${language}:${image}`;
        const pool = this.pools.get(poolKey) || [];

        for (let i = pool.length - 1; i >= 0; i--) {
            const container = pool[i];
            if (this.isContainerValid(container)) {
                pool.splice(i, 1);
                container.lastUsed = Date.now();
                if (await this.isContainerRunning(container.id)) {
                    return container.id;
                }
            } else {
                pool.splice(i, 1);
            }
        }

        return null;
    }

    async returnContainer(language: string, image: string, containerId: string): Promise<void> {
        if (!containerId || !validateImage(image)) {
            return;
        }

        const poolKey = `${language}:${image}`;
        const pool = this.pools.get(poolKey) || [];

        if (pool.length >= this.maxPoolSize) {
            const oldest = pool.shift();
            if (oldest) {
                this.removeContainer(oldest.id).catch(() => {
                });
            }
        }

        const isRunning = await this.isContainerRunning(containerId);
        if (isRunning) {
            try {
                await this.cleanContainer(containerId);
                pool.push({
                    id: containerId,
                    language,
                    image,
                    createdAt: Date.now(),
                    lastUsed: Date.now()
                });
                this.pools.set(poolKey, pool);
            } catch {
                this.removeContainer(containerId).catch(() => {
                });
            }
        }
    }

    private async cleanContainer(containerId: string): Promise<void> {
        try {
            await execAsync(`docker exec ${containerId} sh -c "rm -rf /tmp/* /code/* /input/* /output/* 2>/dev/null || true"`, {
                timeout: 5000
            });
        } catch {
        }
    }

    private async isContainerRunning(containerId: string): Promise<boolean> {
        try {
            const { stdout } = await execAsync(`docker ps -q -f id=${containerId}`, { timeout: 2000 });
            return stdout.trim().length > 0;
        } catch {
            return false;
        }
    }

    private isContainerValid(container: PooledContainer): boolean {
        const age = Date.now() - container.createdAt;
        const idle = Date.now() - container.lastUsed;
        return age < this.containerTTL && idle < this.containerTTL;
    }

    private async removeContainer(containerId: string): Promise<void> {
        try {
            await execAsync(`docker rm -f ${containerId} 2>/dev/null || true`, { timeout: 3000 });
        } catch {
        }
    }

    private async cleanup(): Promise<void> {
        for (const [poolKey, pool] of this.pools.entries()) {
            const validContainers: PooledContainer[] = [];
            for (const container of pool) {
                if (this.isContainerValid(container) && await this.isContainerRunning(container.id)) {
                    validContainers.push(container);
                } else {
                    this.removeContainer(container.id).catch(() => {
                    });
                }
            }
            if (validContainers.length > 0) {
                this.pools.set(poolKey, validContainers);
            } else {
                this.pools.delete(poolKey);
            }
        }
    }

    async createPooledContainer(language: string, image: string, dockerArgs: string[]): Promise<string | null> {
        const containerId = await this.getContainer(language, image);
        if (containerId) {
            return containerId;
        }

        return new Promise((resolve) => {
            const dockerProcess = spawn('docker', dockerArgs, {
                detached: true,
                stdio: 'ignore'
            });

            dockerProcess.on('error', () => {
                resolve(null);
            });

            dockerProcess.on('spawn', () => {
                const containerName = dockerArgs[dockerArgs.indexOf('--name') + 1];
                setTimeout(() => {
                    execAsync(`docker ps -q -f name=${containerName}`, { timeout: 2000 })
                        .then(({ stdout }) => {
                            const id = stdout.trim();
                            resolve(id || null);
                        })
                        .catch(() => resolve(null));
                }, 100);
            });
        });
    }

    async shutdown(): Promise<void> {
        for (const pool of this.pools.values()) {
            for (const container of pool) {
                await this.removeContainer(container.id);
            }
        }
        this.pools.clear();
    }
}

export const containerPool = new ContainerPool();

