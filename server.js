import express from "express";
import cors from "cors";
import { readFileSync } from "fs";

// Manually load .env
const env = readFileSync(".env", "utf-8");
env.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) process.env[key.trim()] = value.trim();
});
const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  console.log("Anthropic response:", JSON.stringify(data, null, 2));

  // Handle overloaded error from Anthropic
  if (data.type === "error" && data.error?.type === "overloaded_error") {
    return res.json({
      content: [
        {
          type: "text",
          text: "The AI assistant is currently experiencing high demand. Please wait a moment and try again.",
        },
      ],
    });
  }

  res.json(data);
});

app.listen(3001, () => console.log("Proxy running on http://localhost:3001"));
