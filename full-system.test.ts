import { Request, Response } from 'express';
import { handleExecute } from './src/cap/execute';
import * as capValidator from './src/modules/debugger/cap-validator';
import * as settlementVerifier from './src/modules/debugger/settlement';
import * as a2aTester from './src/modules/debugger/a2a-tester';
import * as abiDecoder from './src/modules/explainer/abi-decoder';
import * as summarizer from './src/modules/explainer/summarizer';
import { JobPayload, DebugReport, ExplainerReport } from './src/types';

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
    return res as Response;
};

// Mock the modules
jest.mock('./src/modules/debugger/cap-validator');
jest.mock('./src/modules/debugger/settlement');
jest.mock('./src/modules/debugger/a2a-tester');
jest.mock('./src/modules/explainer/abi-decoder');
jest.mock('./src/modules/explainer/summarizer');

describe('BlockTrace Agent - Full System Test', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Feature: Debugger (`debug` type)', () => {

        it('Scenario: All checks PASS for a healthy agent', async () => {
            // Arrange
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'PASS', score: 100, details: 'CAP integration is valid.' });
            (settlementVerifier.verifySettlement as jest.Mock).mockResolvedValue({ status: 'PASS', score: 95, details: 'Settlement is healthy.' });
            (a2aTester.testA2aComposability as jest.Mock).mockResolvedValue({ status: 'PASS', score: 98, details: 'A2A composability is excellent.' });

            const reqBody = { job_id: 'test-1', type: 'debug', target: 'http://healthy-agent.com' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            // Act
            await handleExecute(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];
            const report = responseJson.result as DebugReport;

            expect(report.summary).toBe('PASS');
            expect(report.checks?.cap_integration?.status).toBe('PASS');
            expect(report.checks?.settlement?.status).toBe('PASS');
            expect(report.checks?.a2a_composability?.status).toBe('PASS');
            expect(report.recommendations.length).toBe(1); // Should have the "No critical issues" recommendation
            expect(report.recommendations[0].priority).toBe('LOW');
        });

        it('Scenario: One check FAILS, report summary should be FAIL with critical recommendation', async () => {
            // Arrange
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'FAIL', score: 5, details: 'Endpoint is unreachable.' });
            (settlementVerifier.verifySettlement as jest.Mock).mockResolvedValue({ status: 'PASS', score: 95, details: 'Settlement is healthy.' });
            (a2aTester.testA2aComposability as jest.Mock).mockResolvedValue({ status: 'PASS', score: 98, details: 'A2A composability is excellent.' });

            const reqBody = { job_id: 'test-2', type: 'debug', target: 'http://failing-agent.com' };
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

        it('Scenario: One check WARNS, report summary should be WARN with medium/high recommendation', async () => {
            // Arrange
            (capValidator.validateCapIntegration as jest.Mock).mockResolvedValue({ status: 'PASS', score: 100, details: 'CAP integration is valid.' });
            (settlementVerifier.verifySettlement as jest.Mock).mockResolvedValue({ status: 'WARN', score: 55, details: 'USDC balance is low.' });
            (a2aTester.testA2aComposability as jest.Mock).mockResolvedValue({ status: 'PASS', score: 98, details: 'A2A composability is excellent.' });

            const reqBody = { job_id: 'test-3', type: 'debug', target: 'http://warning-agent.com' };
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

    describe('Feature: Smart Contract Explainer (`explain` type)', () => {

        it('Scenario: Successfully explains a contract', async () => {
            // Arrange
            const mockAbi = [{ "type": "function", "name": "transfer", "inputs": [] }];
            const mockSummary = { summary: "This is a token contract.", key_functions: ["transfer"], risk_flags: [] };

            (abiDecoder.getContractAbi as jest.Mock).mockResolvedValue(mockAbi);
            (summarizer.summarizeAbi as jest.Mock).mockResolvedValue(mockSummary);

            const reqBody = { job_id: 'test-4', type: 'explain', address: '0x123...', network: 'ethereum' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            // Act
            await handleExecute(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];
            const report = responseJson.result as ExplainerReport;

            expect(report.contract_address).toBe('0x123...');
            expect(report.summary).toBe("This is a token contract.");
            expect(report.key_functions).toContain("transfer");
            expect(report.risk_flags.length).toBe(0);
        });

        it('Scenario: Fails when ABI cannot be fetched', async () => {
            // Arrange
            (abiDecoder.getContractAbi as jest.Mock).mockRejectedValue(new Error("Contract not verified"));

            const reqBody = { job_id: 'test-5', type: 'explain', address: '0xinvalid...', network: 'ethereum' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            // Act
            await handleExecute(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            const responseJson = (res.json as jest.Mock).mock.calls[0][0];

            expect(responseJson.status).toBe('failed');
            expect(responseJson.error).toBe('Contract not verified');
        });
    });
});
