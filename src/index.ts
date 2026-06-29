import express, { Request, Response } from 'express';
import { JobPayload } from './types';
import { handleHire } from './cap/hire';
import { handleExecute } from './cap/execute';
import { handleSettle } from './cap/settle';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// CAP Protocol Routes
app.post('/hire', handleHire);
app.post('/execute', handleExecute);
app.post('/settle', handleSettle);

// Root endpoint for health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    name: "BlockTrace", 
    version: "1.0.0",
    status: "healthy",
    documentation: "See context.md for API details."
  });
});

app.listen(PORT, () => {
  console.log(`BlockTrace agent is running on port ${PORT}`);
});
