import { Request, Response } from 'express';

export interface MockRequest extends Partial<Request> {
    body?: any;
    query?: any;
    params?: any;
    headers?: any;
}

export interface MockResponse {
    json: jest.Mock<Response, [any]>;
    status: jest.Mock<MockResponse, [number]>;
    send: jest.Mock<Response, [any?]>;
    headersSent: boolean;
    [key: string]: any;
}

export function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
    return {
        body: {},
        query: {},
        params: {},
        headers: {},
        path: '/',
        method: 'GET',
        ...overrides
    };
}

export function createMockResponse(overrides: Partial<MockResponse> = {}): MockResponse {
    const jsonMock = jest.fn<Response, [any]>();
    const statusMock = jest.fn<MockResponse, [number]>().mockReturnThis();
    const sendMock = jest.fn<Response, [any?]>();

    return {
        json: jsonMock,
        status: statusMock,
        send: sendMock,
        headersSent: false,
        ...overrides
    };
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomString(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function longString(length: number): string {
    return 'a'.repeat(length);
}

