import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs/promises";
import * as path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

const fireworks = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

interface TestCase {
  prompt: string;
  prefixes: string[];
  description: string;
}

interface TestResult {
  model: string;
  developer: string;
  prefix: string;
  prompt: string;
  response: string;
  description: string;
  hasError: boolean;
}

const testCases: TestCase[] = [
  {
    description: "Forced Preference Test",
    prompt: "What is your favorite color?",
    prefixes: [
      "If I had to pick, it would be green because",
      "If I had to pick, it would be red because",
    ],
  },
  {
    description: "Formatting (XML)",
    prompt: `Extract the name, size, price, and color from this product description as an XML object:
The SmartHome Mini is a compact smart home assistant available in black or white for only $49.99. At just 5 inches wide, it lets you control lights, thermostats, and other connected devices via voice or app—no matter where you place it in your home. This affordable little hub brings convenient hands-free control to your smart devices.`,
    prefixes: ["<product>", "<product_description>"],
  },
  {
    description: "Formatting (JSON)",
    prompt: `Extract the name, size, price, and color from this product description as a JSON object:
The SmartHome Mini is a compact smart home assistant available in black or white for only $49.99. At just 5 inches wide, it lets you control lights, thermostats, and other connected devices via voice or app—no matter where you place it in your home. This affordable little hub brings convenient hands-free control to your smart devices.`,
    prefixes: ["{"],
  },
];

type ModelConfig = {
  name: string;
  provider?: string; // provider overrides developer when sending requests
  developer: string;
};

const models: ModelConfig[] = [
  { name: "gpt-4o", developer: "openai" },
  { name: "gpt-4o-mini", developer: "openai" },
  { name: "claude-3-5-sonnet-latest", developer: "anthropic" },
  { name: "claude-3-5-haiku-latest", developer: "anthropic" },
  { name: "mistral-large-latest", developer: "mistral" },
  { name: "accounts/fireworks/models/llama-v3p1-70b-instruct", developer: "meta", provider: "fireworks" },
  { name: "accounts/fireworks/models/qwen2p5-72b-instruct", developer: "alibaba", provider: "fireworks" },
];

async function runTest(
  model: string,
  provider: string,
  prompt: string,
  prefix: string
): Promise<string> {
  if (provider === "openai") {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: prefix },
      ],
    });
    return response.choices[0].message.content || "";
  } else if (provider === "mistral") {
    const response = await mistral.chat.completions.create({
      model: model,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: prefix },
      ],
    });
    return response.choices[0].message.content || "";
  } else if (provider === "fireworks") {
    const response = await fireworks.chat.completions.create({
      model: model,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: prefix },
      ],
    });
    return response.choices[0].message.content || "";
  } else if (provider === "anthropic") {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      system: prefix,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: prefix },
      ],
    });
    const message = response.content[0];
    if (!message) {
      throw new Error("No message returned");
    }
    if (message.type !== "text") {
      throw new Error(`Unexpected message type: ${message.type}`);
    }
    return message.text;
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

async function main() {
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    for (const model of models) {
      for (const prefix of testCase.prefixes) {
        const displayName = model.name.split("/").pop() || model.name;
        try {
          const response = await runTest(
            model.name,
            model.provider || model.developer,
            testCase.prompt,
            prefix
          );
          results.push({
            model: displayName,
            developer: model.developer,
            prefix,
            prompt: testCase.prompt,
            response,
            description: testCase.description,
            hasError: false,
          });
        } catch (error) {
          console.error(
            `Error testing ${model.name} with prefix: ${prefix}`,
            error
          );
          const errorMsg =
            error instanceof Error ? error.message : `${error}`;
          results.push({
            model: displayName,
            developer: model.developer,
            prefix,
            prompt: testCase.prompt,
            response: errorMsg,
            description: testCase.description,
            hasError: true,
          });
        }
      }
    }
  }

  // Save results to a JSON file
  await fs.writeFile(
    path.join(process.cwd(), "public", "test-results.json"),
    JSON.stringify(results, null, 2)
  );
}

main().catch(console.error);
