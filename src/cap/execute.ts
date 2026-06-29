import { Request, Response } from 'express';
import { JobPayload, DebugReport, CheckResult } from '../types';
import { validateCapIntegration } from '../modules/debugger/cap-validator';
import { verifySettlement } from '../modules/debugger/settlement';

export const handleExecute = async (req: Request, res: Response) => {
  const payload = req.body as JobPayload;
  const { job_id } = req.body;

  console.log(`Executing job ${job_id} with payload:`, payload);

  if (!job_id) {
    return res.status(400).json({ error: "job_id is required." });
  }

  try {
    let result;
    if (payload.type === 'debug') {
      const mode = payload.mode || 'full';
      const checks: { [key: string]: CheckResult } = {};
      
      if (mode === 'full' || mode === 'cap') {
        checks.cap_integration = await validateCapIntegration(payload.target);
      }
      
      if (mode === 'full' || mode === 'settlement') {
        checks.settlement = await verifySettlement(payload.target);
      }

      const overallStatus = Object.values(checks).some(c => c.status === 'FAIL') ? 'FAIL' :
                           Object.values(checks).some(c => c.status === 'WARN') ? 'WARN' : 'PASS';

      const report: Partial<DebugReport> = {
        agent_id: "BlockTrace_v1",
        job_id: job_id,
        target: payload.target,
        summary: overallStatus,
        checks: checks,
        recommendations: [], // To be implemented
        generated_at: new Date().toISOString(),
      };
      
      result = report;

    } else if (payload.type === 'explain') {
      console.log(`Routing to explainer for address: ${payload.address}`);
      result = { message: `Explain job for ${payload.address} would be processed here.` };
    } else {
      return res.status(400).json({ error: "Invalid job type." });
    }

    res.status(200).json({
      job_id: job_id,
      status: "completed",
      result: result
    });

  } catch (error) {
    console.error(`Error executing job ${job_id}:`, error);
    res.status(500).json({ 
      job_id: job_id,
      status: "failed",
      error: "An unexpected error occurred." 
    });
  }
};
