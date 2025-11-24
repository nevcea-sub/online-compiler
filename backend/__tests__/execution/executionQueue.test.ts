import { ExecutionQueue } from '../../execution/executionQueue';

describe('ExecutionQueue', () => {
    let queue: ExecutionQueue;

    beforeEach(() => {
        queue = new ExecutionQueue(2, 10);
    });

    afterEach(() => {
        jest.clearAllMocks();
        queue.clear();
    });

    describe('enqueue', () => {
        it('should execute task immediately when under limit', async () => {
            let executed = false;
            const task = async () => {
                executed = true;
            };

            await queue.enqueue('test1', 'python', task);
            expect(executed).toBe(true);
            expect(queue.getRunningCount()).toBe(0);
        });

        it('should queue task when at concurrent limit', async () => {
            const executionOrder: string[] = [];
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            const task1 = async () => {
                executionOrder.push('start1');
                await delay(50);
                executionOrder.push('end1');
            };

            const task2 = async () => {
                executionOrder.push('start2');
                await delay(50);
                executionOrder.push('end2');
            };

            const task3 = async () => {
                executionOrder.push('start3');
                await delay(50);
                executionOrder.push('end3');
            };

            const p1 = queue.enqueue('test1', 'python', task1);
            const p2 = queue.enqueue('test2', 'python', task2);
            const p3 = queue.enqueue('test3', 'python', task3);

            await Promise.all([p1, p2, p3]);

            expect(executionOrder[0]).toBe('start1');
            expect(executionOrder[1]).toBe('start2');
            expect(executionOrder[2]).toBe('end1');
            expect(executionOrder[3]).toBe('start3');
        });

        it('should reject when queue is full', async () => {
            const tasks: Promise<void>[] = [];
            const longRunningTask = async () => {
                await new Promise(resolve => setTimeout(resolve, 200));
            };

            for (let i = 0; i < 2; i++) {
                tasks.push(queue.enqueue(`running${i}`, 'python', longRunningTask));
            }

            for (let i = 0; i < 10; i++) {
                tasks.push(queue.enqueue(`queued${i}`, 'python', longRunningTask));
            }

            await new Promise(resolve => setTimeout(resolve, 50));

            await expect(
                queue.enqueue('test11', 'python', async () => {})
            ).rejects.toThrow('Execution queue is full');

            await Promise.all(tasks);
        });

        it('should reject duplicate execution id', async () => {
            const task = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            };

            const p1 = queue.enqueue('test1', 'python', task);
            await expect(
                queue.enqueue('test1', 'python', async () => {})
            ).rejects.toThrow('Execution already in progress');

            await p1;
        });

        it('should handle task errors', async () => {
            const errorTask = async () => {
                throw new Error('Task failed');
            };

            await expect(
                queue.enqueue('test1', 'python', errorTask)
            ).rejects.toThrow('Task failed');
        });
    });

    describe('priority handling', () => {
        it('should execute higher priority tasks first', async () => {
            const executionOrder: string[] = [];
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            const lowPriority = async () => {
                executionOrder.push('low');
                await delay(10);
            };

            const highPriority = async () => {
                executionOrder.push('high');
                await delay(10);
            };

            queue.enqueue('test1', 'python', lowPriority, 0);
            await new Promise(resolve => setTimeout(resolve, 5));
            queue.enqueue('test2', 'python', highPriority, 10);
            queue.enqueue('test3', 'python', lowPriority, 0);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(executionOrder[0]).toBe('low');
            expect(executionOrder[1]).toBe('high');
        });
    });

    describe('status methods', () => {
        it('should return correct running count', async () => {
            expect(queue.getRunningCount()).toBe(0);

            const task = async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
            };

            const p = queue.enqueue('test1', 'python', task);
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(queue.getRunningCount()).toBe(1);

            await p;
            expect(queue.getRunningCount()).toBe(0);
        });

        it('should return correct queue size', async () => {
            expect(queue.getQueueSize()).toBe(0);

            const task = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            };

            queue.enqueue('test1', 'python', task);
            queue.enqueue('test2', 'python', task);
            queue.enqueue('test3', 'python', task);

            await new Promise(resolve => setTimeout(resolve, 10));
            expect(queue.getQueueSize()).toBe(1);
        });

        it('should return correct running count by language', async () => {
            const task = async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
            };

            queue.enqueue('test1_python_1', 'python', task);
            queue.enqueue('test2_java_1', 'java', task);

            await new Promise(resolve => setTimeout(resolve, 10));
            expect(queue.getRunningCountByLanguage('python')).toBe(1);
            expect(queue.getRunningCountByLanguage('java')).toBe(1);
        });

        it('should return correct status', () => {
            const status = queue.getStatus();
            expect(status).toHaveProperty('running');
            expect(status).toHaveProperty('queued');
            expect(status).toHaveProperty('maxConcurrent');
            expect(status).toHaveProperty('maxQueueSize');
            expect(status.maxConcurrent).toBe(2);
            expect(status.maxQueueSize).toBe(10);
        });
    });

    describe('clear', () => {
        it('should clear queue and running tasks', async () => {
            const task = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            };

            queue.enqueue('test1', 'python', task);
            queue.enqueue('test2', 'python', task);

            await new Promise(resolve => setTimeout(resolve, 10));
            queue.clear();

            expect(queue.getRunningCount()).toBe(0);
            expect(queue.getQueueSize()).toBe(0);
        });
    });
});

