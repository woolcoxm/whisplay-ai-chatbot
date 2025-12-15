import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.M5STACK_API_KEY || "sk-";
const baseURL = process.env.M5STACK_BASE_URL || "http://127.0.0.1:8000/v1";

export const m5stackClient = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});
