import axios from 'axios';
import { ExplainerReport } from '../../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const buildPrompt = (abi: string, address: string): string => {
    // Attempt to parse the ABI to get function names for a better prompt
    let functionNames: string[] = [];
    try {
        const parsedAbi = JSON.parse(abi);
        functionNames = parsedAbi
            .filter((item: any) => item.type === 'function')
            .map((item: any) => item.name);
    } catch (e) {
        // If parsing fails, just use the raw ABI string
    }

    return `You are an expert smart contract analyst. Below is the ABI for a smart contract at address ${address}.

Your task is to do two things:
1.  Provide a concise, one-paragraph summary of the contract's likely purpose based on its functions. Explain what a typical user might do with this contract.
2.  List up to 5 of the most important public functions a user would interact with, along with a brief, one-sentence description of what each function does.
3.  Identify and list any potential security risks based on function names, following the risk categories below.

**ABI:**
\`\`\`json
${abi}
\`\`\`

**Function Names found:** ${functionNames.join(', ')}

**Output Format:**
Your response MUST be a valid JSON object. Do not include any text outside of the JSON structure. The JSON object should have three keys: "summary", "key_functions", and "risk_flags".

- "summary": A string containing the one-paragraph summary.
- "key_functions": An array of objects, where each object has "name" and "description" strings.
- "risk_flags": An array of objects, where each object has "severity" ('HIGH', 'MEDIUM', 'LOW'), "label", and "description" strings.

**Risk Categories to look for:**
- HIGH: Functions named 'mint', 'ownerMint', 'setOwner', 'upgrade', 'selfDestruct', 'setProxy'. These indicate powerful administrative controls.
- MEDIUM: Functions named 'pause', 'setFees', 'setTax', 'setBlacklist'. These can affect contract operation.
- LOW: Functions without clear NatSpec comments or with generic names like 'execute', 'process'.

Begin your analysis now.`;
};


export const summarizeAbi = async (abi: string, address: string): Promise<Partial<ExplainerReport>> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not set in environment variables.");
    }

    const prompt = buildPrompt(abi, address);

    try {
        const response = await axios.post(
            ANTHROPIC_API_URL,
            {
                model: "claude-3-haiku-20240307", // Using Haiku for speed and cost-effectiveness
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
            }
        );

        const content = response.data.content[0].text;
        
        // The LLM output might have markdown ```json ... ``` around the actual JSON.
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;

        const parsedResult = JSON.parse(jsonString);

        return {
            summary: parsedResult.summary,
            key_functions: parsedResult.key_functions,
            risk_flags: parsedResult.risk_flags,
        };

    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("Anthropic API Error:", error.response.data);
            throw new Error(`Anthropic API request failed: ${error.response.data.error.message}`);
        }
        throw new Error(`Failed to get summary from Anthropic: ${error.message}`);
    }
};
