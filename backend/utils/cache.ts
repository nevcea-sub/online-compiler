import { createHash } from 'crypto';
import { CONFIG } from '../config';

const DEFAULT_CACHE_MAX_SIZE = 1000;
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRY_SIZE_BYTES = 10 * 1024 * 1024;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export interface CacheEntry {
    output?: string;
    error?: string;
    executionTime: number;
    images?: string[];
    timestamp: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    evictions: number;
}

interface LRUNode {
    key: string;
    entry: CacheEntry;
    prev: LRUNode | null;
    next: LRUNode | null;
}

class ExecutionCache {
    private cache: Map<string, LRUNode>;
    private stats: CacheStats;
    private readonly maxSize: number;
    private readonly ttl: number;
    private cleanupInterval: NodeJS.Timeout | null = null;
    private head: LRUNode | null = null;
    private tail: LRUNode | null = null;

    constructor(maxSize: number = DEFAULT_CACHE_MAX_SIZE, ttl: number = DEFAULT_CACHE_TTL_MS) {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0,
            evictions: 0
        };
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.startCleanup();
    }

    private moveToHead(node: LRUNode): void {
        if (node === this.head) {
            return;
        }

        if (node.prev) {
            node.prev.next = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        if (node === this.tail) {
            this.tail = node.prev;
        }

        node.prev = null;
        node.next = this.head;
        if (this.head) {
            this.head.prev = node;
        }
        this.head = node;
        if (!this.tail) {
            this.tail = node;
        }
    }

    private removeTail(): string | null {
        if (!this.tail) {
            return null;
        }

        const key = this.tail.key;
        this.cache.delete(key);

        if (this.tail.prev) {
            this.tail.prev.next = null;
            this.tail = this.tail.prev;
        } else {
            this.head = null;
            this.tail = null;
        }

        return key;
    }

    private generateKey(code: string, language: string, input: string): string {
        const normalizedCode = code.trim();
        const normalizedInput = input.trim();
        const data = `${language}:${normalizedCode}:${normalizedInput}`;
        return createHash('sha256').update(data).digest('hex');
    }

    private isExpired(entry: CacheEntry, now: number = Date.now()): boolean {
        return now - entry.timestamp > this.ttl;
    }

    get(code: string, language: string, input: string): CacheEntry | null {
        if (!CONFIG.ENABLE_CACHE) {
            return null;
        }

        const key = this.generateKey(code, language, input);
        const node = this.cache.get(key);

        if (!node) {
            this.stats.misses++;
            return null;
        }

        const now = Date.now();
        if (this.isExpired(node.entry, now)) {
            if (node.prev) {
                node.prev.next = node.next;
            }
            if (node.next) {
                node.next.prev = node.prev;
            }
            if (node === this.head) {
                this.head = node.next;
            }
            if (node === this.tail) {
                this.tail = node.prev;
            }
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.size--;
            return null;
        }

        if (node !== this.head) {
            this.moveToHead(node);
        }
        this.stats.hits++;
        return node.entry;
    }

    set(code: string, language: string, input: string, result: Omit<CacheEntry, 'timestamp'>): void {
        if (!CONFIG.ENABLE_CACHE) {
            return;
        }

        let resultSize = 0;
        if (result.output) {
            resultSize += result.output.length;
        }
        if (result.error) {
            resultSize += result.error.length;
        }
        if (result.images) {
            for (let i = 0; i < result.images.length; i++) {
                resultSize += result.images[i].length;
            }
            resultSize += result.images.length - 1;
        }
        resultSize += 20;
        if (resultSize > MAX_CACHE_ENTRY_SIZE_BYTES) {
            return;
        }

        if (this.cache.size >= this.maxSize) {
            const evictedKey = this.removeTail();
            if (evictedKey) {
                this.stats.evictions++;
                this.stats.size--;
            }
        }

        const key = this.generateKey(code, language, input);
        const entry: CacheEntry = {
            ...result,
            timestamp: Date.now()
        };

        const existingNode = this.cache.get(key);
        if (existingNode) {
            existingNode.entry = entry;
            if (existingNode !== this.head) {
                this.moveToHead(existingNode);
            }
        } else {
            const newNode: LRUNode = {
                key,
                entry,
                prev: null,
                next: this.head
            };

            if (this.head) {
                this.head.prev = newNode;
            }
            this.head = newNode;
            if (!this.tail) {
                this.tail = newNode;
            }

            this.cache.set(key, newNode);
            this.stats.size = this.cache.size;
        }
    }

    private cleanup(): void {
        let cleaned = 0;
        const now = Date.now();
        const nodesToRemove: LRUNode[] = [];

        for (const node of this.cache.values()) {
            if (this.isExpired(node.entry, now)) {
                nodesToRemove.push(node);
            }
        }

        for (const node of nodesToRemove) {
            if (node.prev) {
                node.prev.next = node.next;
            }
            if (node.next) {
                node.next.prev = node.prev;
            }
            if (node === this.head) {
                this.head = node.next;
            }
            if (node === this.tail) {
                this.tail = node.prev;
            }
            this.cache.delete(node.key);
            cleaned++;
        }

        if (cleaned > 0) {
            this.stats.size = this.cache.size;
            if (CONFIG.DEBUG_MODE) {
                console.log(`[CACHE] Cleaned up ${cleaned} expired entries`);
            }
        }
    }

    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, CLEANUP_INTERVAL_MS);
    }

    getStats(): CacheStats & { hitRate: number; totalRequests: number } {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

        return {
            ...this.stats,
            hitRate,
            totalRequests
        };
    }

    stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

import { parseIntegerEnv } from './envValidation';

const CACHE_MAX_SIZE_MIN = 100;
const CACHE_MAX_SIZE_MAX = 10000;
const CACHE_TTL_MS_MIN = 60 * 1000;
const CACHE_TTL_MS_MAX = 24 * 60 * 60 * 1000;

export const executionCache = new ExecutionCache(
    parseIntegerEnv(process.env.CACHE_MAX_SIZE, DEFAULT_CACHE_MAX_SIZE, CACHE_MAX_SIZE_MIN, CACHE_MAX_SIZE_MAX),
    parseIntegerEnv(process.env.CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS, CACHE_TTL_MS_MIN, CACHE_TTL_MS_MAX)
);

