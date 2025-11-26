import { Request, Response } from 'express';
import { ExecuteRequestBody } from '../types';
import { executionService } from '../services/executionService';

export function createExecuteRoute(codeDir: string, outputDir: string, kotlinCacheDir: string) {
    return async (req: Request<{}, {}, ExecuteRequestBody>, res: Response): Promise<void> => {
        await executionService.execute(req.body, { codeDir, outputDir, kotlinCacheDir }, res);
    };
}
