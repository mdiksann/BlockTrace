import { CheckResult } from "../../types";

// Placeholder for fetching agent metadata from a hypothetical Agent Store
const getAgentMetadata = async (target: string): Promise<{ endpoint: string }> => {
    // In a real implementation, this would query the CROO Agent Store
    // to resolve a CAP agent ID to an endpoint URL.
    if (target.startsWith('http')) {
        return { endpoint: target };
    }
    // For now, we'll assume the target is a direct URL if not a known ID format
    console.warn(`Assuming target "${target}" is a direct endpoint URL.`);
    return { endpoint: target };
}

/**
 * Tests if a target agent can be properly called by another agent (A2A).
 * 
 * @param target The agent endpoint URL or CAP agent ID.
 * @returns A CheckResult object with the A2A composability score and details.
 */
export const testA2aComposability = async (target: string): Promise<CheckResult> => {
    console.log(`[A2A Tester] Starting A2A composability test for: ${target}`);

    try {
        const { endpoint } = await getAgentMetadata(target);
        const startTime = Date.now();

        // Simulate an A2A 'hire' call
        // We send a minimal, universally acceptable payload
        const hireResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Minimal payload to see if the agent responds to a basic hire
                job_type: 'ping', // a generic job type many agents might have for health checks
                payment: {
                    token: "USDC",
                    amount: "0"
                }
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        const latency = Date.now() - startTime;

        if (!hireResponse.ok) {
            return {
                status: "FAIL",
                score: 10,
                details: `Agent failed to respond to a simulated A2A hire request. Status: ${hireResponse.status} ${hireResponse.statusText}.`,
                errors: [`[HTTP ${hireResponse.status}] The agent endpoint is not composable.`]
            };
        }

        const responseBody = await hireResponse.json();

        // Check for a structured response (e.g., contains a job_id or session_id)
        if (!responseBody.job_id && !responseBody.session_id) {
            return {
                status: "WARN",
                score: 60,
                details: `Agent responded to hire, but the response was not a standard CAP structure (missing 'job_id' or 'session_id').`,
                errors: [`Received non-standard response: ${JSON.stringify(responseBody).substring(0, 100)}...`]
            };
        }

        return {
            status: "PASS",
            score: 100,
            details: `Agent is A2A composable. Responded to hire request in ${latency}ms with a standard structure.`,
        };

    } catch (error: any) {
        console.error(`[A2A Tester] Error during A2A test for ${target}:`, error);
        
        let errorMessage = "An unexpected error occurred during the A2A test.";
        if (error.name === 'AbortError') {
            errorMessage = "Agent did not respond to the hire request within the 5-second timeout.";
        } else if (error.cause?.code) {
            errorMessage = `A network error occurred: ${error.cause.code}`;
        }

        return {
            status: "FAIL",
            score: 0,
            details: "Could not verify A2A composability due to a critical error.",
            errors: [errorMessage]
        };
    }
};
