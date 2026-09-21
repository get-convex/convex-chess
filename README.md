# Convex

This example demonstrates how to build a fully functional chat app using React, Next.js and Convex.

The app was build within few hours. The computer just does random valid moves for now. Will improve later.

## Run locally

```bash
npm install
rm -rf convex.json
npx convex init
npm run dev
```

## Jev move ratings

New moves receive a 1–10 rating from `typesafe/jev-1.13` through the Convex AI
Gateway's experimental evaluation interface. The rating appears below the move
commentary; select a move in the move list to see its rating. Existing moves are
not backfilled. This is an AI estimate, not a chess-engine evaluation.

The app must run on a deployment with AI Gateway access and a gateway with
`/alpha/decisions` deployed. Local deployments must be project-linked and signed
in. To use staging, set `CONVEX_INTERNAL_AI_GATEWAY_HOST` on the Convex deployment
to the staging gateway origin. Each move adds one billed Decisions request.

The AI SDK provider authenticates with `getServiceToken("ai-gateway")`; no
separate Jev API key is needed. Jev's
[score rubric](https://docs.typesafe.ai/primitives/score) has ten levels from
0–9; the app adds one and rounds to one decimal place.
Ratings run independently of text commentary and show an unavailable state on failure.

## Deploy your own

Deploy the example using [Vercel](https://docs.convex.dev/using/hosting/vercel):
