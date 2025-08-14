# Chatbot Application (Nhost + Hasura + n8n)

This app demonstrates a GraphQL-only chatbot with email auth and real-time chat using Nhost (Hasura + Auth), and an n8n workflow via Hasura Action.

## Env

Copy `.env.example` to `.env` and set either:
- `VITE_NHOST_BACKEND_URL` (preferred) like `https://project-xxx.region.nhost.run`, or
- `VITE_NHOST_SUBDOMAIN` and `VITE_NHOST_REGION`.

## Run locally

- `npm i`
- `npm run dev`

## Deploy (Netlify)

- Add env vars in Netlify build settings (same as `.env`).
- Build command: `npm run build`
- Publish directory: `dist`

## Hasura schema

Tables:

- `public.chats`
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null` (references `auth.users.id`)
  - `title text not null`
  - `created_at timestamptz default now()`

- `public.messages`
  - `id uuid primary key default gen_random_uuid()`
  - `chat_id uuid not null` (references `public.chats.id`)
  - `user_id uuid not null` (owner for user messages; set to chat owner for assistant messages)
  - `role text not null check (role in ('user','assistant'))`
  - `content text not null`
  - `created_at timestamptz default now()`

RLS Permissions (role: `user` only):

- chats
  - select: `user_id = X-Hasura-User-Id`
  - insert: with preset `user_id` from `X-Hasura-User-Id`
  - update/delete: `user_id = X-Hasura-User-Id`

- messages
  - select: `_exists(chats where chats.id = messages.chat_id and chats.user_id = X-Hasura-User-Id)`
  - insert: preset `user_id = X-Hasura-User-Id`; check that `chat.user_id = X-Hasura-User-Id`
  - update/delete: same ownership condition

Hasura session variables must include `X-Hasura-User-Id` via Nhost Auth.

## GraphQL Action

Action name: `sendMessage`

SDL:

```graphql
# action.graphql
type Mutation {
  sendMessage(chat_id: uuid!, content: String!): SendMessageOutput!
}

type SendMessageOutput {
  reply_content: String!
}
```

Action handler: n8n webhook URL (POST). Forward Headers: `Authorization` required.

Permissions: expose to role `user` only.

## n8n workflow

Steps:

1. Webhook (POST) receives `{ input: { arguments: { chat_id, content } } }` from Hasura. Read `Authorization` header.
2. Verify JWT using Nhost JWKS or call Hasura `whoami` GraphQL; extract `x-hasura-user-id`.
3. Query Hasura to ensure chat ownership:
   - GraphQL query `chats_by_pk(id: $chat_id) { id user_id }` and check equality with `userId`.
4. Insert user message if not already inserted by frontend (idempotency optional).
5. Call OpenRouter API with system prompt and user message using secret API key.
6. Insert assistant message via Hasura GraphQL mutation with `role: "assistant"` and `content` from OpenRouter.
7. Return `{ reply_content }` to Action response.

Use Hasura admin secret or a dedicated service role for n8n; never expose to frontend.

## Frontend GraphQL-only contract

- Queries/Mutations/Subscriptions are in `src/graphql/operations.ts`.
- Creating a chat uses `insert_chats_one`.
- Sending a message:
  1) Insert user message
  2) Call `sendMessage` Action (n8n -> OpenRouter -> Hasura)
  3) The assistant message appears via subscription

No REST calls are made from the frontend.

## Notes

- Ensure Hasura `Action` handler is set to your n8n public webhook URL.
- Enable CORS for your Netlify domain in Nhost/Hasura if needed.
- For local dev, run `nhost up` or connect to a hosted Nhost project.
