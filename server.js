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

// Category → search query mapping for each API
const CATEGORY_QUERIES = {
  all:        { news: "healthcare insurance medical coverage costs",                      medline: "health" },
  mental:     { news: "mental health treatment access therapy insurance coverage",        medline: "mental health" },
  physical:   { news: "physical therapy rehabilitation orthopedic treatment coverage",    medline: "injuries" },
  heart:      { news: "heart disease treatment cardiologist cardiovascular care costs",   medline: "heart disease" },
  family:     { news: "pediatric care family medicine children health insurance",         medline: "family health" },
  medication: { news: "prescription drug cost pharmacy insurance coverage generic",       medline: "medicines" },
};

function cleanXml(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") // unwrap CDATA
    .replace(/&lt;/g, "<")                          // decode entities first
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")                         // &amp; must be last
    .replace(/<[^>]+>/g, "")                        // now strip decoded HTML tags
    .trim();
}

async function fetchNewsAPI(query) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const url =
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}` +
    `&language=en&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "ok") return [];

  return data.articles
    .filter((a) => a.title && a.description && a.url && !a.title.includes("[Removed]"))
    .map((a, i) => ({
      id: `news-${i}-${Date.now()}`,
      title: a.title,
      summary: a.description,
      source: a.source.name || "News",
      url: a.url,
      provider: "NewsAPI",
    }));
}

async function fetchMedlinePlus(query) {
  const url =
    `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics` +
    `&term=${encodeURIComponent(query)}&retmax=9`;

  const response = await fetch(url);
  const xml = await response.text();

  const documents = [];
  const docPattern = /<document [^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/document>/g;

  for (const match of xml.matchAll(docPattern)) {
    const docUrl = match[1];
    const content = match[2];

    const titleMatch = content.match(/<content name="title">([\s\S]*?)<\/content>/);
    const snippetMatch = content.match(/<content name="snippet">([\s\S]*?)<\/content>/);

    const title = titleMatch ? cleanXml(titleMatch[1]) : null;
    const summary = snippetMatch ? cleanXml(snippetMatch[1]) : null;

    if (title && summary && docUrl) {
      documents.push({
        id: `medline-${documents.length}-${Date.now()}`,
        title,
        summary,
        source: "MedlinePlus",
        url: docUrl,
        provider: "MedlinePlus",
      });
    }
  }

  return documents;
}

app.get("/api/articles", async (req, res) => {
  const category = req.query.category || "all";
  const queries = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

  const [newsResult, medlineResult] = await Promise.allSettled([
    fetchNewsAPI(queries.news),
    fetchMedlinePlus(queries.medline),
  ]);

  const articles = [
    ...(medlineResult.status === "fulfilled" ? medlineResult.value : []),
    ...(newsResult.status === "fulfilled" ? newsResult.value : []),
  ];

  res.json({ articles });
});

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
