import { Request, Response } from 'express';
import crypto from 'crypto';
import { HireRequest, HireResponse } from '../types';
import { logger } from '../utils/logger';

// Pricing table per CONTEXT.md
const PRICING: Record<string, { amount: string; token: string }> = {
  full:       { amount: '2.00', token: 'USDC' },
  cap:        { amount: '0.75', token: 'USDC' },
  settlement: { amount: '0.75', token: 'USDC' },
  a2a:        { amount: '1.00', token: 'USDC' },
};

export const handleHire = (req: Request, res: Response) => {
  const body = req.body as HireRequest;
  const job_id = crypto.randomUUID();

  logger.info('Hire request received', { job_id, target: body.target, mode: body.mode });

  if (!body.target || typeof body.target !== 'string') {
    return res.status(400).json({
      status: 'rejected',
      job_id,
      message: 'Missing or invalid "target" field.',
    } as HireResponse);
  }

  const mode = body.mode || 'full';
  const pricing = PRICING[mode] || PRICING['full'];

  const response: HireResponse = {
    status: 'accepted',
    job_id,
    message: `Job accepted. Send target payload to POST /execute with this job_id. Settlement: ${pricing.amount} ${pricing.token}.`,
    pricing,
  };

  logger.info('Hire accepted', { job_id, pricing });
  res.status(200).json(response);
};
