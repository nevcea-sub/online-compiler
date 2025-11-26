import { ExecutionQueue } from '../execution/executionQueue';
import { ContainerPool } from '../docker/containerPool';
import { executionQueue as defaultExecutionQueue } from '../execution/executionQueue';
import { containerPool as defaultContainerPool } from '../docker/containerPool';

export interface DependencyContainer {
    executionQueue: ExecutionQueue;
    containerPool: ContainerPool;
}

class DependencyContainerImpl implements DependencyContainer {
    constructor(
        public executionQueue: ExecutionQueue,
        public containerPool: ContainerPool
    ) {}
}

export const container = new DependencyContainerImpl(defaultExecutionQueue, defaultContainerPool);
