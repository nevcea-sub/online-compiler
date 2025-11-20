import { getResourceStats, formatBytes, formatUptime } from '../../utils/resourceMonitor';

describe('Resource Monitor', () => {
    describe('getResourceStats', () => {
        it('should return resource statistics', () => {
            const stats = getResourceStats();

            expect(stats).toHaveProperty('memory');
            expect(stats).toHaveProperty('uptime');
            expect(stats).toHaveProperty('timestamp');

            expect(stats.memory).toHaveProperty('used');
            expect(stats.memory).toHaveProperty('total');
            expect(stats.memory).toHaveProperty('percentage');

            expect(typeof stats.memory.used).toBe('number');
            expect(typeof stats.memory.total).toBe('number');
            expect(typeof stats.memory.percentage).toBe('number');
            expect(stats.memory.percentage).toBeGreaterThanOrEqual(0);
            expect(stats.memory.percentage).toBeLessThanOrEqual(100);

            expect(typeof stats.uptime).toBe('number');
            expect(stats.uptime).toBeGreaterThanOrEqual(0);

            expect(typeof stats.timestamp).toBe('number');
        });

        it('should return increasing uptime', async () => {
            const stats1 = getResourceStats();
            await new Promise(resolve => setTimeout(resolve, 100));
            const stats2 = getResourceStats();

            expect(stats2.uptime).toBeGreaterThanOrEqual(stats1.uptime);
        });
    });

    describe('formatBytes', () => {
        it('should format bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1024 * 1024)).toBe('1 MB');
            expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
        });

        it('should format fractional values', () => {
            const result = formatBytes(1536);
            expect(result).toContain('KB');
            expect(parseFloat(result)).toBeGreaterThan(1);
        });

        it('should handle large values', () => {
            const result = formatBytes(1024 * 1024 * 1024 * 2.5);
            expect(result).toContain('GB');
        });
    });

    describe('formatUptime', () => {
        it('should format seconds correctly', () => {
            expect(formatUptime(0)).toBe('0s');
            expect(formatUptime(30 * 1000)).toBe('30s');
            expect(formatUptime(59 * 1000)).toBe('59s');
        });

        it('should format minutes correctly', () => {
            expect(formatUptime(60 * 1000)).toBe('1m 0s');
            expect(formatUptime(90 * 1000)).toBe('1m 30s');
            expect(formatUptime(125 * 1000)).toBe('2m 5s');
        });

        it('should format hours correctly', () => {
            expect(formatUptime(60 * 60 * 1000)).toBe('1h 0m 0s');
            expect(formatUptime(90 * 60 * 1000)).toBe('1h 30m 0s');
            expect(formatUptime(2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 15 * 1000)).toBe('2h 30m 15s');
        });

        it('should format days correctly', () => {
            expect(formatUptime(24 * 60 * 60 * 1000)).toBe('1d 0h 0m');
            expect(formatUptime(25 * 60 * 60 * 1000)).toBe('1d 1h 0m');
            expect(formatUptime(2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('2d 5h 30m');
        });
    });
});

