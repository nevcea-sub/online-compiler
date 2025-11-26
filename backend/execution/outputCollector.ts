const TRUNCATED_MARKER = '\n[truncated]';
const UTF8_ENCODING = 'utf8';

interface OutputState {
    content: string;
    bytes: number;
    truncated: boolean;
}

export class OutputCollector {
    private maxBytes: number;
    private stdoutState: OutputState;
    private stderrState: OutputState;

    constructor(maxBytes: number) {
        this.maxBytes = maxBytes;
        this.stdoutState = this.createOutputState();
        this.stderrState = this.createOutputState();
    }

    private createOutputState(): OutputState {
        return {
            content: '',
            bytes: 0,
            truncated: false
        };
    }

    private getState(isStdout: boolean): OutputState {
        return isStdout ? this.stdoutState : this.stderrState;
    }

    private addOutput(data: Buffer | string, isStdout: boolean): void {
        const state = this.getState(isStdout);

        if (state.truncated) {
            return;
        }

        const text = data.toString(UTF8_ENCODING);
        const bytes = Buffer.byteLength(text, UTF8_ENCODING);
        const remaining = this.maxBytes - state.bytes;

        if (remaining <= 0) {
            state.truncated = true;
            return;
        }

        if (bytes <= remaining) {
            state.content += text;
            state.bytes += bytes;
        } else {
            const slice = Buffer.from(text, UTF8_ENCODING).subarray(0, remaining).toString(UTF8_ENCODING);
            state.content += slice;
            state.bytes += remaining;
            state.truncated = true;
        }
    }

    addStdout(data: Buffer | string): void {
        this.addOutput(data, true);
    }

    addStderr(data: Buffer | string): void {
        this.addOutput(data, false);
    }

    getFinalOutput(): { stdout: string; stderr: string } {
        const stdout = this.stdoutState.truncated
            ? this.stdoutState.content + TRUNCATED_MARKER
            : this.stdoutState.content;
        const stderr = this.stderrState.truncated
            ? this.stderrState.content + TRUNCATED_MARKER
            : this.stderrState.content;
        return { stdout, stderr };
    }
}
