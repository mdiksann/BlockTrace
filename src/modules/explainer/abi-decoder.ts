import axios from 'axios';

const getEtherscanApiUrl = (network: string): string => {
    switch (network) {
        case 'polygon':
            return 'https://api.polygonscan.com/api';
        case 'bsc':
            return 'https://api.bscscan.com/api';
        case 'ethereum':
        default:
            return 'https://api.etherscan.io/api';
    }
};

interface EtherscanResponse {
    status: string;
    message: string;
    result: string;
}

/**
 * Fetches the ABI for a verified contract from Etherscan.
 * @param address The EVM contract address.
 * @param network The network name (ethereum, polygon, bsc).
 * @returns A promise that resolves to the ABI string or rejects with an error.
 */
export const getContractAbi = async (address: string, network: string = 'ethereum'): Promise<string> => {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
        throw new Error("ETHERSCAN_API_KEY is not set in environment variables.");
    }

    const apiUrl = getEtherscanApiUrl(network);
    
    const params = {
        module: 'contract',
        action: 'getabi',
        address: address,
        apikey: apiKey,
    };

    try {
        const response = await axios.get<EtherscanResponse>(apiUrl, { params });
        const data = response.data;

        if (data.status === "1") {
            // Status "1" means success
            return data.result;
        } else {
            // Status "0" means error, message is in the result field
            throw new Error(`Etherscan API Error: ${data.result}`);
        }
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Failed to connect to Etherscan API: ${error.message}`);
        }
        // Re-throw errors from the try block (e.g., Etherscan API Error)
        throw error;
    }
};
