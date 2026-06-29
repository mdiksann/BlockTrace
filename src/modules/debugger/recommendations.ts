import { CheckResult, Recommendation } from "../../types";

/**
 * Generates actionable recommendations based on diagnostic check results.
 * 
 * @param checks Object containing all check results (cap_integration, settlement, a2a_composability)
 * @returns Array of prioritized recommendations
 */
export const generateRecommendations = (checks: { [key: string]: CheckResult }): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Analyze CAP Integration check
    if (checks.cap_integration) {
        const check = checks.cap_integration;
        
        if (check.status === 'FAIL') {
            if (check.details?.includes('unreachable') || check.details?.includes('timeout')) {
                recommendations.push({
                    priority: 'CRITICAL',
                    check: 'CAP Integration',
                    issue: 'Agent endpoint is unreachable or timed out.',
                    fix: 'Verify that your agent is running and accessible at the provided URL. Check firewall settings and ensure the endpoint is publicly accessible.',
                    docs_url: 'https://docs.croo.io/cap/endpoints'
                });
            }
            
            if (check.details?.includes('handshake') || check.details?.includes('CAP')) {
                recommendations.push({
                    priority: 'CRITICAL',
                    check: 'CAP Integration',
                    issue: 'CAP protocol handshake failed.',
                    fix: 'Ensure your agent implements the CAP protocol correctly. Check that you are using the latest @croo/cap-sdk and that your hire(), execute(), and settle() methods follow the CAP specification.',
                    docs_url: 'https://docs.croo.io/cap/protocol'
                });
            }
            
            if (check.details?.includes('method') || check.details?.includes('hire') || check.details?.includes('execute') || check.details?.includes('settle')) {
                recommendations.push({
                    priority: 'CRITICAL',
                    check: 'CAP Integration',
                    issue: 'Required CAP methods are missing or malformed.',
                    fix: 'Implement all three required CAP methods: hire(), execute(), and settle(). Each must accept and return properly structured JSON payloads as per the CAP specification.',
                    docs_url: 'https://docs.croo.io/cap/methods'
                });
            }
        }
        
        if (check.status === 'WARN') {
            recommendations.push({
                priority: 'HIGH',
                check: 'CAP Integration',
                issue: check.details || 'CAP integration has warnings.',
                fix: 'Review the check details and ensure your implementation follows CAP best practices. Consider testing with the official CAP validator tool.',
                docs_url: 'https://docs.croo.io/cap/best-practices'
            });
        }
    }

    // Analyze Settlement check
    if (checks.settlement) {
        const check = checks.settlement;
        
        if (check.status === 'FAIL') {
            if (check.details?.includes('balance') || check.details?.includes('USDC')) {
                recommendations.push({
                    priority: 'CRITICAL',
                    check: 'Settlement',
                    issue: 'Agent wallet has insufficient USDC balance for settlement.',
                    fix: 'Fund your agent wallet with USDC. You need at least enough for gas fees plus the value of transactions you plan to settle. Recommended minimum: 10 USDC.',
                    docs_url: 'https://docs.croo.io/cap/settlement'
                });
            }
            
            if (check.details?.includes('wallet') || check.details?.includes('address')) {
                recommendations.push({
                    priority: 'CRITICAL',
                    check: 'Settlement',
                    issue: 'Wallet address is invalid or not configured.',
                    fix: 'Verify that CAP_AGENT_WALLET in your environment variables is a valid EVM address. Ensure the corresponding private key (CAP_AGENT_PRIVATE_KEY) is also correctly configured.',
                    docs_url: 'https://docs.croo.io/cap/wallet-setup'
                });
            }
            
            if (check.details?.includes('failed') || check.details?.includes('reverted')) {
                recommendations.push({
                    priority: 'HIGH',
                    check: 'Settlement',
                    issue: 'Recent settlement transactions have failed or reverted.',
                    fix: 'Check your settlement logic for bugs. Ensure you are calling the correct USDC contract methods and that gas limits are appropriate. Review failed transaction logs on Etherscan.',
                    docs_url: 'https://docs.croo.io/cap/troubleshooting-settlement'
                });
            }
        }
        
        if (check.status === 'WARN') {
            if (check.details?.includes('balance') || check.score !== undefined && check.score < 70) {
                recommendations.push({
                    priority: 'MEDIUM',
                    check: 'Settlement',
                    issue: 'USDC balance is low or settlement health score is below optimal.',
                    fix: 'Top up your wallet with USDC to ensure you can handle incoming jobs. Monitor your wallet balance regularly and set up alerts.',
                    docs_url: 'https://docs.croo.io/cap/monitoring'
                });
            }
        }
    }

    // Analyze A2A Composability check
    if (checks.a2a_composability) {
        const check = checks.a2a_composability;
        
        if (check.status === 'FAIL') {
            if (check.details?.includes('timeout')) {
                recommendations.push({
                    priority: 'HIGH',
                    check: 'A2A Composability',
                    issue: 'Agent did not respond to A2A hire request within acceptable time.',
                    fix: 'Optimize your agent response time. Ensure hire() method responds quickly (ideally <2 seconds). Move heavy processing to execute() phase.',
                    docs_url: 'https://docs.croo.io/cap/performance'
                });
            }
            
            if (check.details?.includes('respond') || check.details?.includes('composable')) {
                recommendations.push({
                    priority: 'HIGH',
                    check: 'A2A Composability',
                    issue: 'Agent failed to respond correctly to A2A hire request.',
                    fix: 'Ensure your hire() endpoint accepts requests from other agents and returns a properly structured response with a job_id or session_id.',
                    docs_url: 'https://docs.croo.io/cap/a2a-integration'
                });
            }
        }
        
        if (check.status === 'WARN') {
            if (check.details?.includes('non-standard') || check.details?.includes('structure')) {
                recommendations.push({
                    priority: 'MEDIUM',
                    check: 'A2A Composability',
                    issue: 'Agent response structure does not fully conform to CAP standards.',
                    fix: 'Update your hire() response to include standard CAP fields: job_id (or session_id), status, and estimated_completion_time. This improves interoperability with other agents.',
                    docs_url: 'https://docs.croo.io/cap/response-schema'
                });
            }
        }
    }

    // If everything passed, add a positive note
    if (recommendations.length === 0) {
        recommendations.push({
            priority: 'LOW',
            check: 'Overall',
            issue: 'No critical issues detected.',
            fix: 'Your agent appears to be properly configured. Continue monitoring performance and consider listing on the CROO Agent Store if not already listed.',
            docs_url: 'https://docs.croo.io/agent-store/listing'
        });
    }

    // Sort by priority: CRITICAL > HIGH > MEDIUM > LOW
    const priorityOrder: { [key: string]: number } = {
        'CRITICAL': 0,
        'HIGH': 1,
        'MEDIUM': 2,
        'LOW': 3
    };
    
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
};
