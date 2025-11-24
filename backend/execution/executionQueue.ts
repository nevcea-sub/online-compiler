interface QueuedExecution {
    id: string;
    language: string;
    priority: number;
    timestamp: number;
    execute: () => Promise<void>;
    resolve: () => void;
    reject: (error: Error) => void;
}

export class ExecutionQueue {
    private queue: QueuedExecution[] = [];
    private running: Set<string> = new Set();
    private maxConcurrent: number;
    private maxQueueSize: number;

    constructor(maxConcurrent: number = 5, maxQueueSize: number = 50) {
        this.maxConcurrent = maxConcurrent;
        this.maxQueueSize = maxQueueSize;
    }

    async enqueue(
        id: string,
        language: string,
        execute: () => Promise<void>,
        priority: number = 0
    ): Promise<void> {
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error('Execution queue is full. Please try again later.');
        }

        if (this.running.has(id)) {
            throw new Error('Execution already in progress');
        }

        return new Promise<void>((resolve, reject) => {
            const queued: QueuedExecution = {
                id,
                language,
                priority,
                timestamp: Date.now(),
                execute,
                resolve,
                reject
            };

            this.queue.push(queued);
            this.queue.sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return a.timestamp - b.timestamp;
            });

            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.running.size >= this.maxConcurrent) {
            return;
        }

        if (this.queue.length === 0) {
            return;
        }

        const next = this.queue.shift();
        if (!next) {
            return;
        }

        this.running.add(next.id);

        next.execute()
            .then(() => {
                this.running.delete(next.id);
                next.resolve();
                this.processQueue();
            })
            .catch((error: Error) => {
                this.running.delete(next.id);
                next.reject(error);
                this.processQueue();
            });
    }

    getRunningCount(): number {
        return this.running.size;
    }

    getQueueSize(): number {
        return this.queue.length;
    }

    getRunningCountByLanguage(language: string): number {
        return Array.from(this.running).filter(id => id.includes(`_${language}_`)).length;
    }

    getStatus(): {
                running: number;
                queued: number;
                maxConcurrent: number;
                maxQueueSize: number;
                } {
        return {
            running: this.running.size,
            queued: this.queue.length,
            maxConcurrent: this.maxConcurrent,
            maxQueueSize: this.maxQueueSize
        };
    }

    clear(): void {
        this.queue = [];
        this.running.clear();
    }
}

import { parseIntegerEnv } from '../utils/envValidation';

const DEFAULT_MAX_CONCURRENT = 5;
const DEFAULT_MAX_QUEUE_SIZE = 50;
const MAX_CONCURRENT_MIN = 1;
const MAX_CONCURRENT_MAX = 50;
const MAX_QUEUE_SIZE_MIN = 10;
const MAX_QUEUE_SIZE_MAX = 500;

export const executionQueue = new ExecutionQueue(
    parseIntegerEnv(process.env.MAX_CONCURRENT_EXECUTIONS, DEFAULT_MAX_CONCURRENT, MAX_CONCURRENT_MIN, MAX_CONCURRENT_MAX),
    parseIntegerEnv(process.env.MAX_QUEUE_SIZE, DEFAULT_MAX_QUEUE_SIZE, MAX_QUEUE_SIZE_MIN, MAX_QUEUE_SIZE_MAX)
);

