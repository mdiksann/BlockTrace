import { Request, Response } from 'express';
import { handleExecute } from './src/cap/execute';
import * as capValidator from './src/modules/debugger/cap-validator';
import * as settlementVerifier from './src/modules/debugger/settlement';
import * as a2aTester from './src/modules/debugger/a2a-tester';
import { DebugReport } from './src/types';

// Corrected Mock Express Request
const mockRequest = (body: any): Request => {
    return {
        body,
    } as Request;
};

const mockResponse = (): Response => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as Response;
};

// Mock the modules
jest.mock('./src/modules/debugger/cap-validator');
jest.mock('./src/modules/debugger/settlement');
jest.mock('./src/modules/debugger/a2a-tester');

describe('BlockTrace Agent v2.0 - Full System Test', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Feature: CAP Debugger (full mode)', () => {

        it('Scenario: All checks PASS for a healthy agent', async () => {
            // Arrange
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'PASS', score: 100, details: 'CAP integration is valid.' });
            (settlementVerifier.verifySettlement as jest.Mock).mockResolvedValue({ status: 'PASS', score: 95, details: 'Settlement is healthy.' });
            (a2aTester.testA2aComposability as jest.Mock).mockResolvedValue({ status: 'PASS', score: 98, details: 'A2A composability is excellent.' });

            const reqBody = { job_id: 'test-1', target: 'http://healthy-agent.com', mode: 'full' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            // Act
            await handleExecute(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];
            const report = responseJson.result as DebugReport;

            expect(report.summary).toBe('PASS');
            expect(report.agent_id).toBe('BlockTrace_v2');
            expect(report.checks?.cap_integration?.status).toBe('PASS');
            expect(report.checks?.settlement?.status).toBe('PASS');
            expect(report.checks?.a2a_composability?.status).toBe('PASS');
            expect(report.overall_score).toBeGreaterThanOrEqual(90);
            expect(report.recommendations.length).toBe(1); // "No critical issues" recommendation
            expect(report.recommendations[0].priority).toBe('LOW');
        });

        it('Scenario: One check FAILS, report summary should be FAIL with critical recommendation', async () => {
            // Arrange
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'FAIL', score: 5, details: 'Endpoint is unreachable.' });
            (settlementVerifier.verifySettlement as jest.Mock).mockResolvedValue({ status: 'PASS', score: 95, details: 'Settlement is healthy.' });
            (a2aTester.testA2aComposability as jest.Mock).mockResolvedValue({ status: 'PASS', score: 98, details: 'A2A composability is excellent.' });

            const reqBody = { job_id: 'test-2', target: 'http://failing-agent.com', mode: 'full' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            // Act
            await handleExecute(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];
            const report = responseJson.result as DebugReport;

            expect(report.summary).toBe('FAIL');
            expect(report.checks?.cap_integration?.status).toBe('FAIL');
            expect(report.recommendations.length).toBeGreaterThan(0);
            expect(report.recommendations[0].priority).toBe('CRITICAL');
            expect(report.recommendations[0].issue).toContain('unreachable');
        });

        it('Scenario: One check WARNS, report summary should be WARN with medium recommendation', async () => {
            // Arrange
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'PASS', score: 100, details: 'CAP integration is valid.' });
            (settlementVerifier.verifySettlement as jest.Mock).mockResolvedValue({ status: 'WARN', score: 55, details: 'USDC balance is low.' });
            (a2aTester.testA2aComposability as jest.Mock).mockResolvedValue({ status: 'PASS', score: 98, details: 'A2A composability is excellent.' });

            const reqBody = { job_id: 'test-3', target: 'http://warning-agent.com', mode: 'full' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            // Act
            await handleExecute(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];
            const report = responseJson.result as DebugReport;

            expect(report.summary).toBe('WARN');
            expect(report.checks?.settlement?.status).toBe('WARN');
            expect(report.recommendations.length).toBeGreaterThan(0);
            expect(report.recommendations[0].priority).toBe('MEDIUM');
            expect(report.recommendations[0].issue).toContain('low');
        });
    });

    describe('Feature: Single mode checks', () => {

        it('Scenario: CAP-only mode runs only CAP validator', async () => {
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'PASS', score: 90, details: 'CAP OK.' });

            const reqBody = { job_id: 'test-4', target: 'http://cap-only.com', mode: 'cap' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            await handleExecute(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(capValidator.validateCapIntegration).toHaveBeenCalled();
            expect(settlementVerifier.verifySettlement).not.toHaveBeenCalled();
            expect(a2aTester.testA2aComposability).not.toHaveBeenCalled();

            const report = (res.json as jest.Mock).mock.calls[0][0].result as DebugReport;
            expect(report.checks.cap_integration).toBeDefined();
            expect(report.checks.settlement).toBeUndefined();
            expect(report.checks.a2a_composability).toBeUndefined();
        });

        it('Scenario: Settlement-only mode runs only settlement verifier', async () => {
            (settlementVerifier.verifySettlement as jest.Mock).mockResolvedValue({ status: 'PASS', score: 85, details: 'Settlement OK.' });

            const reqBody = { job_id: 'test-5', target: '0x1234567890abcdef1234567890abcdef12345678', mode: 'settlement' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            await handleExecute(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(capValidator.validateCapIntegration).not.toHaveBeenCalled();
            expect(settlementVerifier.verifySettlement).toHaveBeenCalled();
            expect(a2aTester.testA2aComposability).not.toHaveBeenCalled();
        });
    });

    describe('Feature: Input validation', () => {

        it('Scenario: Missing job_id returns 400', async () => {
            const reqBody = { target: 'http://test.com', mode: 'full' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            await handleExecute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('Scenario: Missing target returns 400 with error code', async () => {
            const reqBody = { job_id: 'test-6' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            await handleExecute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseJson.error.code).toBe('ERR_INVALID_PAYLOAD');
        });

        it('Scenario: Invalid mode returns 400', async () => {
            const reqBody = { job_id: 'test-7', target: 'http://test.com', mode: 'invalid' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            await handleExecute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseJson.error.code).toBe('ERR_INVALID_PAYLOAD');
        });
    });

    describe('Feature: Markdown output format', () => {

        it('Scenario: output_format=markdown returns markdown content', async () => {
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'PASS', score: 100, details: 'CAP OK.' });

            const reqBody = { job_id: 'test-8', target: 'http://test.com', mode: 'cap', output_format: 'markdown' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            await handleExecute(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/markdown');
            expect(res.status).toHaveBeenCalledWith(200);
            const markdown = (res.send as jest.Mock).mock.calls[0][0] as string;
            expect(markdown).toContain('# BlockTrace Diagnostic Report');
            expect(markdown).toContain('CAP Integration');
        });
    });
});
