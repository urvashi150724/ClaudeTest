import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const apiKey = process.env.CLAUDE_API_KEY;

if (!apiKey) {
  throw new Error("CLAUDE_API_KEY is missing in environment variables");
}

const anthropic = new Anthropic({
    apiKey,
});

export default anthropic;