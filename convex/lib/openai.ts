import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { getServiceToken } from "convex/server";

// `getServiceToken` ships in convex 1.44.0 but is marked `@internal`, so the
// published package strips its type declaration. Remove this augmentation
// once a release exports the type.
declare module "convex/server" {
  function getServiceToken(service: "ai-gateway"): Promise<string>;
}

// The Convex AI gateway proxies chat completions to OpenRouter, so model
// names use OpenRouter's `provider/model` form.
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

const STAGING_GATEWAY_HOST = "https://staging.ai-gateway.convex.dev";

// TODO: Import `convexGateway` from `@convex-dev/ai-sdk-provider` once it is
// published. This mirrors it, except the gateway host defaults to staging.
function convexGateway(modelId: string) {
  const provider = createOpenAICompatible({
    name: "convexGateway",
    baseURL: `${
      process.env.CONVEX_INTERNAL_AI_GATEWAY_HOST || STAGING_GATEWAY_HOST
    }/v1`,
    fetch: async (input, init) => {
      // Deployment JWT is the only accepted credential for the hosted
      // gateway. `getServiceToken` reuses one token per action.
      const token = await getServiceToken("ai-gateway");
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return await globalThis.fetch(input, { ...init, headers });
    },
  });
  return provider(modelId);
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(body: {
  messages: LLMMessage[];
  model?: string;
}) {
  const result = streamText({
    model: convexGateway(body.model ?? DEFAULT_MODEL),
    messages: body.messages,
  });
  // `textStream` drops error parts and ends normally, which would turn a
  // failed gateway request into an empty, "successful" analysis. Read the
  // full stream and rethrow errors instead.
  async function* readText() {
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        yield part.text;
      } else if (part.type === "error") {
        throw part.error;
      }
    }
  }
  return {
    content: {
      read: readText,
    },
  };
}
