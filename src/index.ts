import express, { Request, Response } from 'express';
import { handleHire } from './cap/hire';
import { handleExecute } from './cap/execute';
import { handleSettle } from './cap/settle';
import { logger } from './utils/logger';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// CAP Protocol Routes
app.post('/hire', handleHire);
app.post('/execute', handleExecute);
app.post('/settle', handleSettle);

// Health check + agent metadata
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'BlockTrace',
    version: '2.0.0',
    protocol: 'CAP',
    status: 'healthy',
    capabilities: ['cap-validation', 'settlement-verification', 'a2a-composability-testing'],
    pricing: {
      full: '2.00 USDC',
      cap: '0.75 USDC',
      settlement: '0.75 USDC',
      a2a: '1.00 USDC',
    },
    endpoints: {
      hire: 'POST /hire',
      execute: 'POST /execute',
      settle: 'POST /settle',
    },
  });
});

app.listen(PORT, () => {
  logger.info(`BlockTrace v2.0.0 agent running`, { port: PORT });
});

export default app;
