import { Request, Response } from 'express';
import { CheckResult } from '../types';
import { validateJobPayload } from '../utils/validate';
import { BlockTraceError } from '../utils/errors';
import { logger } from '../utils/logger';
import { validateCapIntegration } from '../modules/debugger/cap-validator';
import { verifySettlement } from '../modules/debugger/settlement';
import { testA2aComposability } from '../modules/debugger/a2a-tester';
import { generateRecommendations, generateEnhancedRecommendations } from '../modules/debugger/recommendations';
import { buildReport, formatReportAsMarkdown } from '../modules/debugger/report';

const MAX_JOB_TIMEOUT = parseInt(process.env.MAX_JOB_TIMEOUT_MS || '30000', 10);

export const handleExecute = async (req: Request, res: Response) => {
  const { job_id } = req.body;
  const executionStartTime = Date.now();

  if (!job_id || typeof job_id !== 'string') {
    return res.status(400).json({ error: 'job_id is required. First call POST /hire to obtain one.' });
  }

  logger.info('Execute started', { job_id });

  try {
    const payload = validateJobPayload(req.body);
    const { target, mode, output_format } = payload;
    const checks: { [key: string]: CheckResult } = {};

    // Set up job timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('ERR_JOB_TIMEOUT')), MAX_JOB_TIMEOUT);
    });

    const runChecks = async () => {
      if (mode === 'full' || mode === 'cap') {
        checks.cap_integration = await validateCapIntegration(target);
      }

      if (mode === 'full' || mode === 'settlement') {
        checks.settlement = await verifySettlement(target);
      }

      if (mode === 'full' || mode === 'a2a') {
        checks.a2a_composability = await testA2aComposability(target);
      }
    };

    // Race checks against timeout
    await Promise.race([runChecks(), timeoutPromise]);

    // Generate recommendations — use LLM-enhanced if available, fall back to deterministic
    let recommendations;
    try {
      recommendations = await generateEnhancedRecommendations(checks);
    } catch {
      recommendations = generateRecommendations(checks);
    }

    const report = buildReport({
      job_id,
      target,
      checks,
      recommendations,
      executionStartTime,
    });

    logger.info('Execute completed', { job_id, summary: report.summary, score: report.overall_score });

    if (output_format === 'markdown') {
      const markdown = formatReportAsMarkdown(report);
      res.setHeader('Content-Type', 'text/markdown');
      return res.status(200).send(markdown);
    }

    return res.status(200).json({ job_id, status: 'completed', result: report });

  } catch (error: any) {
    if (error instanceof BlockTraceError) {
      logger.error('Execute failed (BlockTraceError)', { job_id, code: error.code, message: error.message });
      return res.status(error.statusCode).json({
        job_id,
        status: 'failed',
        error: { code: error.code, message: error.message },
      });
    }

    if (error.message === 'ERR_JOB_TIMEOUT') {
      logger.error('Execute timed out', { job_id, timeout_ms: MAX_JOB_TIMEOUT });
      return res.status(504).json({
        job_id,
        status: 'failed',
        error: { code: 'ERR_JOB_TIMEOUT', message: `Job exceeded maximum timeout of ${MAX_JOB_TIMEOUT}ms.` },
      });
    }

    logger.error('Execute failed (unexpected)', { job_id, error: error.message });
    return res.status(500).json({
      job_id,
      status: 'failed',
      error: error.message || 'An unexpected error occurred.',
    });
  }
};
