import express, { Request, Response } from 'express';
import cors from 'cors';
import { handleHire } from './cap/hire';
import { handleExecute } from './cap/execute';
import { handleSettle } from './cap/settle';
import { logger } from './utils/logger';

import { AgentClient, EventType, DeliverableType } from '@croo-network/sdk';
import { runDiagnostics } from './services/diagnostics';
import crypto from 'crypto';

const app = express();

// Enable CORS for all routes (allow direct browser/A2A calls per hackathon rules)
app.use(cors());
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

const server = app.listen(PORT, async () => {
  logger.info(`BlockTrace v2.0.0 agent running (REST API)`, { port: PORT });

  if (process.env.CROO_SDK_KEY) {
    try {
      const client = new AgentClient(
        {
          baseURL: process.env.CROO_API_URL || "https://api.croo.network",
          wsURL: process.env.CROO_WS_URL || "wss://api.croo.network/ws",
          rpcURL: process.env.BASE_RPC_URL || "",
        },
        process.env.CROO_SDK_KEY
      );

      const stream = await client.connectWebSocket();
      logger.info("CROO WebSocket connected. Listening for A2A events...");

      stream.on(EventType.NegotiationCreated, async (e: any) => {
        logger.info(`New A2A negotiation received`, { negotiationId: e.negotiationId });
        try {
          const result = await client.acceptNegotiation(e.negotiationId);
          logger.info(`A2A Order created`, { orderId: result.order.orderId });
        } catch (err: any) {
          logger.error(`Failed to accept negotiation`, { error: err.message });
        }
      });

      stream.on(EventType.OrderPaid, async (e: any) => {
        logger.info(`A2A Order paid. Starting diagnostics...`, { orderId: e.orderId });
        try {
          // Fetch the negotiation to get the requirements payload
          const order = await client.getOrder(e.orderId);
          const negotiation = await client.getNegotiation(order.negotiationId);
          
          let target = 'unknown';
          let mode = 'full';
          
          try {
            if (negotiation.requirements) {
              const reqs = JSON.parse(negotiation.requirements);
              target = reqs.target || target;
              mode = reqs.mode || mode;
            }
          } catch (e) {
            logger.warn('Failed to parse negotiation requirements, using defaults');
          }

          const job_id = crypto.randomUUID();
          // Run the actual BlockTrace diagnostic logic!
          const report = await runDiagnostics(job_id, target, mode);

          await client.deliverOrder(e.orderId, {
            deliverableType: DeliverableType.Text,
            deliverableText: JSON.stringify(report, null, 2),
          });
          logger.info(`A2A Order delivered successfully!`, { orderId: e.orderId });
        } catch (err: any) {
          logger.error(`Deliver error`, { error: err.message });
        }
      });

      stream.on(EventType.OrderCompleted, (e: any) => {
        logger.info(`A2A Order completed and settled!`, { orderId: e.orderId });
      });

      process.on('SIGINT', async () => {
        await stream.close();
        server.close();
        process.exit(0);
      });
    } catch (error: any) {
      logger.error(`Failed to connect to CROO Network`, { error: error.message });
    }
  } else {
    logger.warn('CROO_SDK_KEY not found in environment. WebSocket provider disabled.');
  }
});

export default app;
