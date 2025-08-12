# Nhost Chatbot Application

This is a chatbot application built as an assessment, demonstrating integration with Nhost (Auth, Hasura GraphQL), n8n for workflow automation, and OpenRouter for chatbot AI.

## Features

-   **User Authentication:** Email-based sign-up and sign-in using Nhost Auth.
-   **Secure Data:** Row-Level Security (RLS) in Hasura ensures users only access their own chat data.
-   **Real-time Chat:** GraphQL Subscriptions provide real-time updates for messages.
-   **Chatbot Integration:** Messages are sent to an n8n workflow via a Hasura Action, which then interacts with the OpenRouter AI.
-   **GraphQL Only:** All frontend-to-backend communication uses GraphQL queries, mutations, and subscriptions. No REST APIs are directly called from the frontend.
-   **Centralized API Calls:** All external API calls (e.g., to OpenRouter) are routed through n8n, ensuring secure credential management.

## Technologies Used

-   **Frontend:** React.js
-   **Backend (Managed by Nhost):**
    -   **Nhost Auth:** For user authentication.
    -   **PostgreSQL:** Database.
    -   **Hasura GraphQL Engine:** For GraphQL API, RLS, and Actions.
-   **Workflow Automation:** n8n (for handling Hasura webhooks, calling OpenRouter, and saving bot responses).
-   **AI Model:** OpenRouter (using a free model as specified).

## Setup Instructions

### 1. Nhost Project Setup (Backend)

1.  **Create Nhost Project:**
    -   Go to [nhost.io](https://nhost.io) and sign up/log in.
    -   Create a new project. This will provision your Hasura, PostgreSQL, and Auth services.
    -   Note down your **Nhost Subdomain** and **Region** from your project settings (e.g., `awesome-project-1234` and `us-east-2`). You'll need these for your frontend's `.env` file.
    -   Also, get your **Hasura Admin Secret** from the Nhost dashboard's settings. You'll need this for your n8n workflow.

2.  **Database Schema (Hasura Console):**
    -   Access your Hasura Console from the Nhost dashboard.
    -   Go to the `Data` tab and create the following tables:
        -   **`chats`**
            -   `id`: `uuid` (Primary Key, Default: `gen_random_uuid()`)
            -   `user_id`: `uuid` (Foreign Key to `auth.users.id`)
            -   `created_at`: `timestamp with time zone` (Default: `now()`)
        -   **`messages`**
            -   `id`: `uuid` (Primary Key, Default: `gen_random_uuid()`)
            -   `chat_id`: `uuid` (Foreign Key to `chats.id`)
            -   `user_id`: `uuid` (Foreign Key to `auth.users.id`)
            -   `text`: `text`
            -   `is_bot`: `boolean` (Default: `false`)
            -   `created_at`: `timestamp with time zone` (Default: `now()`)

3.  **Permissions (Hasura Console - RLS):**
    -   For both `chats` and `messages` tables, go to the `Permissions` tab.
    -   Configure **`user` role** permissions:
        -   **`chats` Table:**
            -   **`select`:** Custom check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}`
            -   **`insert`:** Custom check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}` ; Column presets: `user_id` from `X-Hasura-User-Id`.
        -   **`messages` Table:**
            -   **`select`:** Custom check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}`
            -   **`insert`:** Custom check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}` ; Column presets: `user_id` from `X-Hasura-User-Id`.

4.  **Hasura Action (Hasura Console):**
    -   Go to the `Actions` tab. Click `Create`.
    -   **Action Name:** `sendMessage`
    -   **Action Definition:**
        ```graphql
        type Mutation {
          sendMessage(chat_id: uuid!, message: String!): String!
        }
        ```
    -   **Handler URL:** This will be your **n8n Webhook URL**. You'll get this in the next step.
    -   **Permissions:** Set `user` role to `execute`.

### 2. n8n Workflow Setup

1.  **Create n8n Account:**
    -   Go to [n8n.io](https://n8n.io) or set up your own instance.
    -   Create a new workflow.

2.  **OpenRouter API Key:**
    -   Sign up/log in to [openrouter.ai](https://openrouter.ai).
    -   Generate an API Key. You'll need this for the n8n workflow.

3.  **Build the n8n Workflow:**
    -   **Start Node:** Add a **Webhook** trigger node.
        -   Set **HTTP Method** to `POST`.
        -   Copy the `Webhook URL` (for production or testing) – this is what you'll put into your Hasura Action.
        -   Under `Headers` (Add Option), add:
            -   `X-Hasura-User-Id`
            -   `X-Hasura-Role`
    -   **Node 2: HTTP Request (Verify Chat Ownership)**
        -   **Method:** `POST`
        -   **URL:** Your Nhost GraphQL Endpoint (`https://<NHOST_SUBDOMAIN>.graphql.<NHOST_REGION>.nhost.run/v1`).
        -   **Headers:** `x-hasura-admin-secret`: `YOUR_HASURA_ADMIN_SECRET` (from Nhost dashboard).
        -   **Body (GraphQL Query):**
            ```json
            {
              "query": "query GetChatOwner($chatId: uuid!) { chats_by_pk(id: $chatId) { user_id } }",
              "variables": {
                "chatId": "{{ $json.body.input.chat_id }}"
              }
            }
            ```
        -   **Expression for User ID Comparison:** You will likely need a **Function** or **If** node after this to compare `$json.body.session_variables['X-Hasura-User-Id']` with `$node["HTTP Request"].json["data"]["chats_by_pk"]["user_id"]`. If they don't match, you should respond with an error (e.g., using a **Respond to Webhook** node with an error status).
    -   **Node 3: HTTP Request (Call OpenRouter AI)**
        -   **Method:** `POST`
        -   **URL:** `https://openrouter.ai/api/v1/chat/completions`
        -   **Headers:**
            -   `Authorization`: `Bearer YOUR_OPENROUTER_API_KEY`
            -   `Content-Type`: `application/json`
        -   **Body (JSON):**
            ```json
            {
              "model": "openrouter_model", # e.g., "mistralai/mistral-7b-instruct", "google/gemma-7b-it"
              "messages": [
                { "role": "user", "content": "{{ $json.body.input.message }}" }
              ]
            }
            ```
            (Choose a free model available on OpenRouter).
    -   **Node 4: HTTP Request (Save Bot Response to Hasura)**
        -   **Method:** `POST`
        -   **URL:** Your Nhost GraphQL Endpoint.
        -   **Headers:** `x-hasura-admin-secret`: `YOUR_HASURA_ADMIN_SECRET` (from Nhost dashboard).
        -   **Body (GraphQL Mutation):**
            ```json
            {
              "query": "mutation InsertBotMessage($chatId: uuid!, $text: String!, $userId: uuid!) { insert_messages_one(object: {chat_id: $chatId, text: $text, is_bot: true, user_id: $userId}) { id } }",
              "variables": {
                "chatId": "{{ $json.body.input.chat_id }}",
                "text": "{{ $node[\"HTTP Request (Call OpenRouter AI)\"].json[\"choices\"][0][\"message\"][\"content\"] }}",
                "userId": "{{ $json.body.session_variables['X-Hasura-User-Id'] }}" # Use the user ID from the initial webhook
              }
            }
            ```
            Adjust `node` name if it's different.
    -   **End Node: Webhook Response**
        -   **Response Mode:** `Respond to Webhook`
        -   **Body (JSON):**
            ```json
            {
              "bot_response": "{{ $node[\"HTTP Request (Call OpenRouter AI)\"].json[\"choices\"][0][\"message\"][\"content\"] }}"
            }
            ```
        -   This is the data returned to the Hasura Action, and then to your frontend.

### 3. Frontend Development & Deployment

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd chatbot-app
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    -   Create a file named `.env.local` in the root of your project (same level as `package.json`).
    -   Copy the contents of `.env.example` into `.env.local` and **replace the placeholder values** with your actual Nhost subdomain and region.
        ```
        REACT_APP_NHOST_SUBDOMAIN=your-nhost-subdomain
        REACT_APP_NHOST_REGION=your-nhost-region
        ```

4.  **Run Locally:**
    ```bash
    npm start
    # or
    yarn start
    ```
    This will open the application in your browser, usually at `http://localhost:3000`.

5.  **Deployment to Netlify:**
    -   **Create a GitHub Repository:** If you haven't already, create a new public GitHub repository and push all your frontend code to it.
    -   **Login to Netlify:** Go to [netlify.com](https://netlify.com) and log in.
    -   **New Site from Git:** Click `Add new site` -> `Import an existing project`.
    -   **Connect to GitHub:** Connect your GitHub account and select your repository.
    -   **Configure Build Settings:**
        -   **Branch to deploy:** `main` (or your primary branch)
        -   **Build command:** `npm run build` (or `yarn build`)
        -   **Publish directory:** `build`
    -   **Environment Variables in Netlify:** Before deploying, go to your Netlify site settings -> `Build & deploy` -> `Environment variables`. Add the following key-value pairs:
        -   `REACT_APP_NHOST_SUBDOMAIN`: `your-nhost-subdomain`
        -   `REACT_APP_NHOST_REGION`: `your-nhost-region`
    -   **Deploy Site:** Click `Deploy site`. Netlify will build and deploy your application, providing you with a public URL.