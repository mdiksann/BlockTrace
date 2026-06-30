import { CheckResult } from "../../types";
import { logger } from "../../utils/logger";

const getAgentMetadata = async (target: string): Promise<{ endpoint: string }> => {
    if (target.startsWith('http')) {
        return { endpoint: target };
    }
    logger.warn(`Assuming target "${target}" is a direct endpoint URL.`);
    return { endpoint: target };
}

const calculateP95 = (latencies: number[]): number => {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[index];
};

export const testA2aComposability = async (target: string): Promise<CheckResult> => {
    logger.info(`[A2A Tester] Starting A2A composability test for: ${target}`);
    const checks: { name: string; passed: boolean; detail: string }[] = [];
    const errors: string[] = [];
    let totalScore = 0;

    try {
        const { endpoint } = await getAgentMetadata(target);
        
        // ── Check 1: Capability Metadata (GET /) ──
        try {
            logger.debug(`[A2A Tester] Fetching metadata from ${endpoint}`);
            const metaResponse = await fetch(endpoint, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            
            if (metaResponse.ok) {
                const meta = await metaResponse.json();
                const hasName = !!meta.name;
                const hasPricing = !!meta.pricing;
                const hasSchema = !!meta.capabilities || !!meta.endpoints;
                
                if (hasName && hasPricing && hasSchema) {
                    checks.push({ name: 'Capability Metadata', passed: true, detail: 'Agent exposes full metadata (name, pricing, schema).' });
                    totalScore += 30;
                } else {
                    checks.push({ name: 'Capability Metadata', passed: false, detail: 'Metadata incomplete. Missing name, pricing, or schema info.' });
                    errors.push('Agent metadata at GET / is missing standard fields (name, pricing, or capabilities).');
                    totalScore += 10; // Partial credit for responding
                }
            } else {
                checks.push({ name: 'Capability Metadata', passed: false, detail: `GET / returned ${metaResponse.status}.` });
                errors.push(`Failed to fetch metadata from GET /. Status: ${metaResponse.status}`);
            }
        } catch (error: any) {
            checks.push({ name: 'Capability Metadata', passed: false, detail: `Metadata fetch failed: ${error.message}` });
            errors.push('Could not fetch agent metadata.');
        }

        // ── Check 2: Concurrent Hire Requests ──
        logger.debug(`[A2A Tester] Firing 2 concurrent hire requests`);
        
        const makeHireRequest = async () => {
            const start = Date.now();
            const res = await fetch(`${endpoint.replace(/\/$/, '')}/hire`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target: 'ping',
                    mode: 'a2a'
                }),
                signal: AbortSignal.timeout(5000)
            });
            const latency = Date.now() - start;
            
            let body = {};
            try { body = await res.json(); } catch (e) {}
            
            return { ok: res.ok, status: res.status, latency, body };
        };

        const results = await Promise.allSettled([makeHireRequest(), makeHireRequest()]);
        
        const latencies: number[] = [];
        let successCount = 0;
        let validStructure = true;

        results.forEach((res, i) => {
            if (res.status === 'fulfilled') {
                latencies.push(res.value.latency);
                if (res.value.ok) successCount++;
                
                const b: any = res.value.body;
                if (!b.job_id && !b.session_id && !b.status) {
                    validStructure = false;
                }
            } else {
                errors.push(`Request ${i+1} failed completely: ${res.reason?.message || 'Unknown error'}`);
            }
        });

        // Evaluate Concurrency
        if (successCount === 2) {
            checks.push({ name: 'Concurrent Calls', passed: true, detail: 'Agent successfully handled 2 parallel requests.' });
            totalScore += 40;
        } else if (successCount === 1) {
            checks.push({ name: 'Concurrent Calls', passed: false, detail: 'Agent failed 1 of 2 parallel requests.' });
            errors.push('Agent drops or fails concurrent requests.');
            totalScore += 10;
        } else {
            checks.push({ name: 'Concurrent Calls', passed: false, detail: 'All parallel requests failed.' });
            errors.push('Agent failed to respond to hire requests.');
        }

        // Evaluate Response Structure
        if (successCount > 0 && validStructure) {
            checks.push({ name: 'Response Structure', passed: true, detail: 'Responses follow CAP JSON structure.' });
            totalScore += 30;
        } else if (successCount > 0) {
            checks.push({ name: 'Response Structure', passed: false, detail: 'Responses missing required CAP fields (job_id, status).' });
            errors.push('Agent hire response does not follow standard CAP structure.');
        } else {
            checks.push({ name: 'Response Structure', passed: false, detail: 'Could not evaluate structure due to request failures.' });
        }

        // Calculate Latency Metrics
        const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
        const p95Latency = calculateP95(latencies);

        let latencyStatusDetail = `Avg: ${avgLatency}ms | P95: ${p95Latency}ms.`;
        if (p95Latency > 10000) {
            checks.push({ name: 'Latency (P95 < 10s)', passed: false, detail: `${latencyStatusDetail} Exceeded 10s threshold.` });
            errors.push('Agent latency is unacceptably high (P95 > 10s).');
        } else if (latencies.length > 0) {
            checks.push({ name: 'Latency (P95 < 10s)', passed: true, detail: latencyStatusDetail });
        }

        // Determine Overall Status
        const failedChecks = checks.filter(c => !c.passed);
        let overallStatus: CheckResult['status'] = 'PASS';
        if (failedChecks.length > 0) {
            overallStatus = totalScore >= 60 ? 'WARN' : 'FAIL';
        }

        return {
            status: overallStatus,
            score: totalScore,
            details: `A2A Composability: ${checks.filter(c => c.passed).length}/${checks.length} checks passed. Score: ${totalScore}/100.`,
            errors: errors.length > 0 ? errors : undefined,
            raw_data: { checks, metrics: { avg_latency_ms: avgLatency, p95_latency_ms: p95Latency } }
        };

    } catch (error: any) {
        logger.error(`[A2A Tester] Critical error for ${target}`, { error: error.message });
        return {
            status: "FAIL",
            score: 0,
            details: "Could not verify A2A composability due to a critical error.",
            errors: [error.message]
        };
    }
};