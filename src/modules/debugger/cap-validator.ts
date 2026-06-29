import axios from 'axios';
import { CheckResult } from '../../types';

export const validateCapIntegration = async (target: string): Promise<CheckResult> => {
  try {
    const response = await axios.get(target, { timeout: 5000 });

    if (response.status === 200) {
      // Basic check passed. More checks would be added here.
      // e.g., checking CAP headers, method exposure, etc.
      return {
        status: "PASS",
        score: 100,
        details: "Endpoint is reachable and returned a successful response.",
      };
    } else {
      return {
        status: "FAIL",
        score: 0,
        details: `Endpoint returned a non-200 status code: ${response.status}`,
        errors: [`Status: ${response.status} ${response.statusText}`],
      };
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
        return {
            status: "FAIL",
            score: 0,
            details: "Endpoint is unreachable or timed out.",
            errors: [error.message],
        };
    }
    return {
        status: "FAIL",
        score: 0,
        details: "An unexpected error occurred during CAP validation.",
        errors: [error.message],
    };
  }
};
