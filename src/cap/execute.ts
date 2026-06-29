import { Request, Response } from 'express';
import { JobPayload, DebugReport, CheckResult, ExplainerReport, Recommendation } from '../types';
import { validateCapIntegration } from '../modules/debugger/cap-validator';
import { verifySettlement } from '../modules/debugger/settlement';
import { testA2aComposability } from '../modules/debugger/a2a-tester';
import { generateRecommendations } from '../modules/debugger/recommendations';
import { getContractAbi } from '../modules/explainer/abi-decoder';
import { summarizeAbi } from '../modules/explainer/summarizer';

export const handleExecute = async (req: Request, res: Response) => {
  const payload = req.body as JobPayload;
  const { job_id } = req.body;
  const executionStartTime = Date.now();

  console.log(`Executing job ${job_id} with payload:`, payload);

  if (!job_id) {
    return res.status(400).json({ error: "job_id is required." });
  }

  try {
    if (payload.type === 'debug') {
      const mode = payload.mode || 'full';
      const checks: { [key: string]: CheckResult } = {};
      
      if (mode === 'full' || mode === 'cap') {
        checks.cap_integration = await validateCapIntegration(payload.target);
      }
      
      if (mode === 'full' || mode === 'settlement') {
        checks.settlement = await verifySettlement(payload.target);
      }
      
      if (mode === 'full' || mode === 'a2a') {
          checks.a2a_composability = await testA2aComposability(payload.target);
      }

      const overallStatus = Object.values(checks).some(c => c.status === 'FAIL') ? 'FAIL' :
                           Object.values(checks).some(c => c.status === 'WARN') ? 'WARN' : 'PASS';

      const recommendations = generateRecommendations(checks);

      const scores = Object.values(checks).map(c => c.score || 0).filter(s => s > 0);
      const overall_score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const execution_time_ms = Date.now() - executionStartTime;

      const report: DebugReport = {
        agent_id: "BlockTrace_v1",
        job_id: job_id,
        target: payload.target,
        summary: overallStatus,
        overall_score: overall_score,
        execution_time_ms: execution_time_ms,
        checks: checks,
        recommendations: recommendations,
        generated_at: new Date().toISOString(),
      };
      
      return res.status(200).json({ job_id, status: "completed", result: report });

    } else if (payload.type === 'explain') {
        const { address, network = 'ethereum' } = payload;
        
        const abi = await getContractAbi(address, network);
        const summaryData = await summarizeAbi(abi, address);

        const report: ExplainerReport = {
            agent_id: "BlockTrace_v1",
            job_id: job_id,
            contract_address: address,
            network: network,
            verified: true,
            summary: summaryData.summary || "Summary could not be generated.",
            key_functions: summaryData.key_functions || [],
            risk_flags: summaryData.risk_flags || [],
            generated_at: new Date().toISOString(),
        };
        
        return res.status(200).json({ job_id, status: "completed", result: report });

    } else {
      return res.status(400).json({ error: "Invalid job type." });
    }

  } catch (error: any) {
    console.error(`[Job ${job_id}] Execution failed:`, error);
    return res.status(500).json({ 
      job_id: job_id,
      status: "failed",
      error: error.message || "An unexpected error occurred." 
    });
  }
};
