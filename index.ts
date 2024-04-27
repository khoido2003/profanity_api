import { error } from "console";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "hono/adapter";
import { Index } from "@upstash/vector";

const app = new Hono();

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
  } catch (err) {}
});
