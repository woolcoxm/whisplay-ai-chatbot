import fs from "fs";
import { spawn } from "child_process";
import os from "os";
import path from "path";
import { ASRServer } from "../../type";

const asrServer = (process.env.ASR_SERVER || "").toLowerCase() as ASRServer;

// This implementation assumes SenseVoice is set up in a virtual environment as per M5Stack docs
// and `main.py` is available.
// We dynamically construct the default path based on the user's home directory.
const homeDir = os.homedir();
const defaultPythonPath = path.join(homeDir, "rsp/SenseVoice/sensevoice/bin/python");
const defaultScriptPath = path.join(homeDir, "rsp/SenseVoice/main.py");

const senseVoicePythonPath = process.env.M5STACK_SENSEVOICE_PYTHON_PATH || defaultPythonPath;
const senseVoiceScriptPath = process.env.M5STACK_SENSEVOICE_SCRIPT_PATH || defaultScriptPath;

let isSenseVoiceAvailable = false;

export const checkSenseVoiceInstallation = (): boolean => {
  if (fs.existsSync(senseVoicePythonPath) && fs.existsSync(senseVoiceScriptPath)) {
      isSenseVoiceAvailable = true;
      return true;
  }
  console.warn(`SenseVoice python or script not found.
    Checked Python: ${senseVoicePythonPath}
    Checked Script: ${senseVoiceScriptPath}
    Please set M5STACK_SENSEVOICE_PYTHON_PATH and M5STACK_SENSEVOICE_SCRIPT_PATH in .env`);
  return false;
};

if (asrServer === ASRServer.m5stack) {
  checkSenseVoiceInstallation();
}

export const recognizeAudio = async (
  audioFilePath: string
): Promise<string> => {
  if (!isSenseVoiceAvailable) {
    console.error("SenseVoice is not configured correctly. Check M5STACK_SENSEVOICE_PYTHON_PATH and M5STACK_SENSEVOICE_SCRIPT_PATH.");
    return "";
  }
  if (!fs.existsSync(audioFilePath)) {
    console.error("Audio file does not exist:", audioFilePath);
    return "";
  }

  return await new Promise<string>((resolve) => {
    // python main.py -i test.mp3
    // We assume the script outputs the text to stdout
    const params = [
      senseVoiceScriptPath,
      "-i",
      audioFilePath,
    ];

    // We need to run this command.
    // Note: The M5Stack docs example output shows:
    // ['You want to be a nurse or an archi', ...]
    // It prints a list of strings. We need to parse this.

    const child = spawn(senseVoicePythonPath, params);

    let stdout = "";
    let stderr = "";

    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      console.error("Failed to start SenseVoice:", err?.message ?? err);
      resolve("");
    });

    child.on("close", async (code, signal) => {
      if (stderr && stderr.trim()) {
        // CLI may output warnings to stderr
        console.error("SenseVoice stderr:", stderr.trim());
      }
      if (code !== 0) {
        console.error(
          `SenseVoice exited with code ${code}${signal ? ` (signal ${signal})` : ""}`
        );
      }

      const stdoutTrim = stdout ? stdout.trim() : "";
      console.log("SenseVoice stdout:", stdoutTrim);

      // Parse the output. It looks like a python list representation: ['text1', 'text2']
      try {
          const lines = stdoutTrim.split('\n');
          let resultLine = "";
          // Find the last line that starts with '[' which is likely the result list
          for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('[') && line.endsWith(']')) {
                  resultLine = line;
                  break;
              }
          }

          if (resultLine) {
              // Extract content from inside brackets
              // Example: ['Hello world', 'How are you']

              // We want to extract strings between quotes.
              // Regex to find content inside '...' or "..." ignoring escaped quotes if possible (though python repr escapes them)

              const matches = resultLine.matchAll(/(['"])(.*?)\1/g);
              const textParts: string[] = [];

              for (const match of matches) {
                  if (match[2]) {
                      textParts.push(match[2]);
                  }
              }

              if (textParts.length > 0) {
                  // Join with space
                  resolve(textParts.join(" "));
                  return;
              }
          }
      } catch (e) {
          console.error("Error parsing SenseVoice output", e);
      }

      resolve("");
    });
  });
};
