import { m5stackClient } from "./m5stack-client";
import dotenv from "dotenv";
import { TTSResult } from "../../type";
import getWavDuration from "../../utils/wav";

dotenv.config();

const m5stackVoiceModel = process.env.M5STACK_VOICE_MODEL || "CosyVoice2-0.5B-axcl";
const m5stackVoiceType = process.env.M5STACK_VOICE_TYPE || "prompt_data";

const m5stackTTS = async (
  text: string
): Promise<TTSResult> => {
  if (!m5stackClient) {
    console.error("M5Stack Client is not initialized.");
    return { duration: 0 };
  }
  const response = await m5stackClient.audio.speech.create({
    model: m5stackVoiceModel,
    voice: m5stackVoiceType as any,
    input: text,
    response_format: "wav",
  }).catch((error) => {
    console.log("M5Stack TTS failed:", error);
    return null;
  });

  if (!response) {
    return { duration: 0 };
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  try {
      const duration = getWavDuration(buffer);
      if (duration > 0) {
          return { buffer, duration: duration * 1000 };
      }
      // Fallback
      console.warn("WAV duration calculation returned 0, using fallback.");
      return { buffer, duration: text.length * 200 };
  } catch (e) {
      console.warn("Failed to calculate duration", e);
      // Fallback duration estimation
      return { buffer, duration: text.length * 200 };
  }
};

export default m5stackTTS;
