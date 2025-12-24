import * as fs from "fs/promises";

const PATH = "/sys/kernel/debug/gpio";
let dataPromise: Promise<string> | null = null;

async function getData(): Promise<string> {
  if (dataPromise) return dataPromise;
  dataPromise = fs.readFile(PATH, "utf8");
  return dataPromise;
}

async function convertPin(gpioPin: number): Promise<number> {
  let content = "";
  try {
    content = await getData();
  } catch (error) {
    console.warn(`Failed to read GPIO debug info from ${PATH}`, error);
    return gpioPin;
  }

  const lines = content.split("\n");
  for (const line of lines) {
    if (line.includes(`GPIO${gpioPin} `)) {
      const parts = line.split(" ");
      const pin = parts.find((part) => part.startsWith("gpio-"));
      if (pin) {
        return parseInt(pin.replace("gpio-", ""), 10);
      }
    }
  }
  return gpioPin;
}

export { convertPin };
