import { error } from "console";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "hono/adapter";
import { Index } from "@upstash/vector";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// run the server: npx wrangle dev index

const app = new Hono();

const WHITELIST = ["swear"];
const PROFANITY_THRESHOLD = 0.86;

const semanticSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 25,
  separators: [" "],
  chunkOverlap: 12,
});

app.use(cors());

type Environment = { VECTOR_URL: string; VECTOR_TOKEN: string };

app.post("/", async (context) => {
  if (context.req.header("Content-Type") !== "application/json") {
    return context.json({ error: "JSON body expected" }, { status: 406 });
  }

  try {
    const { VECTOR_TOKEN, VECTOR_URL } = env<Environment>(context);

    const index = new Index({
      url: VECTOR_URL,
      token: VECTOR_TOKEN,
      cache: false,
    });

    const body = await context.req.json();
    let { message } = body as { message: string };

    if (!message) {
      return context.json({ error: "message is required" }, { status: 400 });
    }

    if (message.length > 1000) {
      return context.json(
        { error: "message is too long, only 1000 characters at most!" },
        { status: 413 }
      );
    }

    // Avoid the case where the API think the word "swear" is unappropriate.
    message = message
      .split(/\s/)
      .filter((word) => !WHITELIST.includes(word.toLowerCase()))
      .join(" ");

    const [semanticChunks, wordChunks] = await Promise.all([
      splitTextIntoSemantics(message),
      splitTextIntoWords(message),
    ]);

    const flaggedFor = new Set<{ score: number; text: string }>();

    const vectorRes = await Promise.all([
      ...wordChunks!.map(async (wordChunk) => {
        const [vector] = await index.query({
          topK: 1,
          data: wordChunk,
          includeMetadata: true,
        });

        if (vector && vector.score > 0.95) {
          flaggedFor.add({
            text: vector.metadata!.text as string,
            score: vector.score,
          });
        }

        return { score: vector.score };
      }),

      ...semanticChunks!.map(async (semanticChunk) => {
        const [vector] = await index.query({
          topK: 1,
          data: semanticChunk,
          includeMetadata: true,
        });

        if (vector && vector.score > PROFANITY_THRESHOLD) {
          flaggedFor.add({
            text: vector.metadata!.text as string,
            score: vector.score,
          });
        }

        return vector!;
      }),
    ]);

    if (flaggedFor.size > 0) {
      const sorted = Array.from(flaggedFor).sort((a, b) =>
        a.score > b.score ? -1 : 1
      )[0];
      return context.json({
        isProfanity: true,
        score: sorted.score,
        flaggedFor: sorted.text,
      });
    } else {
      const mostProfaneChunk = vectorRes.sort((a, b) =>
        a.score > b.score ? -1 : 1
      )[0];

      return context.json({ isProfanity: true, score: mostProfaneChunk.score });
    }
  } catch (err) {
    console.error(err);
    return context.json({ error: "Something went wrong!" }, { status: 500 });
  }
});

function splitTextIntoWords(message: string) {
  return message.split(/\s/);
}

async function splitTextIntoSemantics(text: string) {
  if (text.split(/\s/).length === 1) {
    return [];
  }

  const documents = await semanticSplitter.createDocuments([text]);
  const chunks = documents.map((chunk) => chunk.pageContent);

  return chunks;
}

export default app;
