export function createTimeoutController(timeoutMs: number): {
    controller: AbortController;
    timeoutId: NodeJS.Timeout;
    clear: () => void;
} {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return {
        controller,
        timeoutId,
        clear: () => clearTimeout(timeoutId)
    };
}
