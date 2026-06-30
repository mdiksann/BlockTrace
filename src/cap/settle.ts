import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { SettleRequest, SettleResponse } from '../types';
import { logger } from '../utils/logger';

export const handleSettle = async (req: Request, res: Response) => {
  const { job_id, transaction_hash } = req.body as SettleRequest;

  logger.info('Settlement requested', { job_id, transaction_hash });

  if (!job_id || !transaction_hash) {
    return res.status(400).json({
      job_id: job_id || 'unknown',
      status: 'failed',
      message: 'Both job_id and transaction_hash are required.',
    } as SettleResponse);
  }

  // Validate tx hash format
  if (!/^0x[a-fA-F0-9]{64}$/.test(transaction_hash)) {
    return res.status(400).json({
      job_id,
      status: 'failed',
      message: 'Invalid transaction_hash format. Must be a 66-character hex string (0x + 64 hex chars).',
    } as SettleResponse);
  }

  // Attempt on-chain verification if RPC available
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (alchemyKey) {
    try {
      const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`);
      const receipt = await provider.getTransactionReceipt(transaction_hash);

      if (receipt && receipt.status === 1) {
        logger.info('Settlement confirmed on-chain', { job_id, block: receipt.blockNumber });
        return res.status(200).json({
          job_id,
          status: 'settled',
          message: 'Settlement confirmed on-chain.',
          on_chain_confirmation: {
            tx_hash: transaction_hash,
            block_number: receipt.blockNumber,
            confirmed: true,
          },
        } as SettleResponse);
      } else if (receipt && receipt.status === 0) {
        logger.warn('Settlement transaction reverted', { job_id, transaction_hash });
        return res.status(400).json({
          job_id,
          status: 'failed',
          message: 'Settlement transaction was reverted on-chain.',
          on_chain_confirmation: {
            tx_hash: transaction_hash,
            block_number: receipt.blockNumber,
            confirmed: false,
          },
        } as SettleResponse);
      } else {
        // Transaction not yet mined
        logger.info('Settlement transaction pending', { job_id, transaction_hash });
        return res.status(202).json({
          job_id,
          status: 'settled',
          message: 'Transaction submitted but not yet confirmed. Will be settled upon confirmation.',
          on_chain_confirmation: {
            tx_hash: transaction_hash,
            confirmed: false,
          },
        } as SettleResponse);
      }
    } catch (error: any) {
      logger.error('Settlement verification failed', { job_id, error: error.message });
      // Fall through to accept-without-verification below
    }
  }

  // If no RPC or verification failed, accept optimistically
  logger.warn('Settlement accepted without on-chain verification (no RPC or verification failed)', { job_id });
  return res.status(200).json({
    job_id,
    status: 'settled',
    message: 'Settlement accepted. On-chain verification unavailable — accepted optimistically.',
  } as SettleResponse);
};
