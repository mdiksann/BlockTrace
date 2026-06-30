import axios from 'axios';
import { logger } from '../utils/logger';
import { createError } from '../utils/errors';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callLLM(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw createError('ERR_LLM_TIMEOUT', 'OPENROUTER_API_KEY is not set in environment variables.');
  }

  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4';

  try {
    logger.debug('Calling OpenRouter LLM', { model });

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content ?? '';
    if (!content) {
      logger.warn('LLM returned empty content', { model });
    }
    return content;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        // Retry once per CONTEXT.md behavior rules
        logger.warn('LLM request timed out, retrying once...', { model });
        try {
          const retryResponse = await axios.post(
            OPENROUTER_URL,
            {
              model,
              messages: [{ role: 'user', content: prompt }],
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 15000,
            }
          );
          return retryResponse.data?.choices?.[0]?.message?.content ?? '';
        } catch {
          throw createError('ERR_LLM_TIMEOUT', 'OpenRouter API timed out after retry.');
        }
      }
      throw createError('ERR_LLM_TIMEOUT', `OpenRouter API error: ${error.message}`);
    }
    throw createError('ERR_LLM_TIMEOUT', `Unexpected LLM error: ${error.message}`);
  }
}
