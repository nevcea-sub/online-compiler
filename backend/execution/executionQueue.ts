import { CONFIG } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('ExecutionQueue');

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

    async enqueue(id: string, language: string, execute: () => Promise<void>, priority: number = 0): Promise<void> {
        if (this.queue.length >= this.maxQueueSize) {
            logger.warn('Queue full', { queueSize: this.queue.length, maxQueueSize: this.maxQueueSize });
            throw new Error('Execution queue is full. Please try again later.');
        }

        if (this.running.has(id)) {
            logger.warn('Duplicate execution ID', { id });
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

            logger.debug('Enqueued', { id, language, queueSize: this.queue.length });
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
        logger.debug('Starting execution', { id: next.id, runningCount: this.running.size });

        next.execute()
            .then(() => {
                this.running.delete(next.id);
                logger.debug('Execution completed', { id: next.id });
                next.resolve();
                this.processQueue();
            })
            .catch((error: Error) => {
                this.running.delete(next.id);
                logger.error('Execution failed', { id: next.id, error });
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
        const searchStr = `_${language}_`;
        let count = 0;
        for (const id of this.running) {
            if (id.includes(searchStr)) {
                count++;
            }
        }
        return count;
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
        logger.info('Queue cleared');
    }
}

export const executionQueue = new ExecutionQueue(CONFIG.MAX_CONCURRENT_EXECUTIONS, CONFIG.MAX_QUEUE_SIZE);
