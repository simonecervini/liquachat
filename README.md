<h1 align="center">Liqua</h1>

<div align="center">
  <img alt="GitHub License" src="https://img.shields.io/github/license/simonecervini/liquachat?style=flat&color=%232B7FFF">
  <img src="https://img.shields.io/github/last-commit/simonecervini/liquachat?style=flat" alt="Last commit" />
</div>

<div align="center">
  <h3>Your private, self-hostable, and local-first AI assistant</h3>
</div>

![liqua chat_chat_fbc2ad84-bb6c-4cfa-a445-aa4ac9c173dc](https://github.com/user-attachments/assets/9c81adf8-3b6c-47f5-a4cb-e1f74f0cdb2b)

> [!WARNING]
> This project was developed in about a week for the T3 Chat hackathon by [Theo (@t3dotgg)](https://github.com/t3dotgg). It's a deliberate exploration of an architecture designed from the ground up for privacy and self-hosting.

> [!NOTE]
> For the sole purpose of the hackathon judging, a public instance of this project is temporarily available at `liqua.chat`. This instance is for demonstration only and will be taken down after the event.
>
> In the future, a public instance might be maintained if the community or a sponsor provides the necessary infrastructure. However, this is not a priority. The project's core incentive is to provide a powerful tool you can run on your own hardware, avoiding the operational costs that would force a subscription model.

## Core Values & Architecture

Understanding Liqua's core values is essential for understanding its architecture. Many design choices might seem unconventional, but they are deliberate decisions to create a truly private, user-owned, and self-hostable AI assistant.

- **Self-Hosting First**: This is not a SaaS product and will never be. Liqua is designed to be run on your own hardware—your PC, a home server, or an on-premise server for your company. It's built for private networks, often without a public domain.
- **Privacy by Design**: All communication happens directly between your browser and the AI provider (e.g., OpenRouter). Your API keys and conversations never pass through an intermediary server. This is a fundamental architectural choice.
- **Bring Your Own Key (BYOK)**: You are always in control of your API keys. They are stored locally in your browser and sent directly to the AI provider.

## Motivation & Philosophy

The goal of Liqua is **not** to create another ChatGPT-clone with a subscription model. I don’t have a full-time team, and I wanted to find a sustainable model to keep the project open-source and alive. Trying to compete with already perfect apps like T3.chat doesn’t make sense – I believe the community needs something different.

Instead, Liqua explores a different path: creating a sustainable, open-source project that gives you full ownership of your data and infrastructure. It's built on the belief that you shouldn't have to depend on a third party to interact with AI models privately. This project is intentionally designed in a way that prevents it from ever becoming a Software-as-a-Service.

This philosophy led to a radical, client-heavy architecture. Most AI assistants use a backend server to manage API requests to AI providers. Liqua pushes this responsibility to the client.

**It is always the user's browser that directly contacts the AI provider.**

<details>
  <summary>How does real-time sync work in this model?</summary>
  
  This client-direct approach doesn't compromise the real-time, local-first experience. When your browser receives the response from the AI provider, it streams the tokens directly to your self-hosted database. The Zero sync engine then instantly propagates the changes to all other connected clients (like other browser tabs). If you stop a stream in one tab, it stops in all of them. This provides a seamless, real-time sync without any intermediary server between you and the AI.
</details>

This is a strange and powerful design, only possible in an application built specifically for self-hosting. It's the key to unlocking the core values of the project.

This client-centric approach unlocks several powerful possibilities:

- **Zero-Trust API Key Handling**: Your API keys never need to be shared with or stored on any server except the AI provider's. This dramatically reduces the security risk.
- **Local Network & Custom Models**: You can run the entire Liqua stack on a local network. This allows you to connect not only to cloud AI providers but also to your own local models running on Ollama or other in-network AI servers. This is ideal for corporate environments or for developers experimenting with local LLMs.
- **True End-to-End Encryption (Future)**: Since the "server" is your own self-hosted instance and the "logic" is in your browser, it's possible to implement end-to-end encryption for your conversations. Before a message is saved and synced, it can be encrypted on your device with a key only you hold. The sync server would only ever see encrypted data.
- **100% Offline Dictation Mode (Future)**: you can run a small speech-to-text model with Ollama and use it to dictate your messages, without relying on external providers.

## Features & Tech Stack

While Liqua includes the standard features you'd expect from an AI assistant, a lot of effort has gone into building a unique, high-quality user experience. The application is built with **Next.js** and uses **Zero** as its real-time sync engine.

Here are a few highlights:

### The Choice of Zero as a Sync Engine

Theo chose Convex for t3.chat and rightly explained why Zero was not a good fit for a public-facing chatbot like his. While it is technically possible to build such an application with Zero, the architectural trade-offs are significant.

Liqua, however, operates under a different set of architectural principles. Because it is designed for self-hosting rather than as a public-facing service, Zero becomes a viable and interesting technology for this project. The decision to use it was a deliberate choice to explore its capabilities in an architecture that could properly support it.

The main trade-off with this architecture is that **resumable streams are not possible**. Because the browser handles the connection, refreshing the page will interrupt the stream. Supporting resumable streams would likely require tools like Durable Objects, which would violate the core "no intermediary servers" principle of the project.

### Rethinking Chat Organization: The Tree Structure

Instead of a traditional, flat list of conversations, Liqua introduces a completely redesigned tree structure. This file system-inspired approach allows for superior organization and unlocks powerful features like **chat forking**.

![output-1](https://github.com/user-attachments/assets/72683d48-7c81-48db-9ad6-b853cfa783bb)

### Experimental Search

Accessible via `Cmd+K`, a powerful, keyboard-driven search interface lets you fuzzy-find any chat. This feature is heavily inspired by Telescope in NeoVim.

![outputtt](https://github.com/user-attachments/assets/ab8d0619-be6e-49a3-a29e-9d28f53dfc9a)

## Self-Hosting

The entire Liqua stack is managed with a single Docker Compose file, designed for easy deployment on your own infrastructure.

To run the entire stack, use the following command. This will build the containers and run them in the background.

```bash
DB_PASSWORD=your_root_password \
BETTER_AUTH_SECRET=$(openssl rand -hex 32) \
docker compose up -d --build
```

This command sets two essential environment variables:

- `DB_PASSWORD`: The root password for the PostgreSQL database.
- `BETTER_AUTH_SECRET`: A required secret for the `better-auth` authentication library. It's best to let this be generated automatically.

> [!NOTE]
> The initial build process can be slow, potentially taking around 10 minutes. It requires downloading several gigabytes of data, so the duration heavily depends on your internet connection speed.

### Configuration

You can customize your Liqua instance via a `liqua.config.json` file in the root of the project (this file is git-ignored). Alternatively, you can provide the configuration as a `LIQUA_CONFIG_JSON` environment variable.

Currently, this file is used to configure authentication methods, such as social providers or enabling a guest login. In the future, it will host many more customization options.

### Services

The `docker-compose.yml` file orchestrates all the necessary services.  
Liqua purposefully exposes **a single port for the whole app (`11904`, overridable via `APP_PORT`)** plus an **optional port for PostgreSQL (`11905`, overridable via `DB_PORT`)** so that it never collides with anything else you might already be running locally.

| Container             | Description                                                                 | Internal Port | Default Host Port |
| --------------------- | --------------------------------------------------------------------------- | ------------- | ----------------- |
| **nginx** (`nginx`)   | Reverse-proxy entry-point that dispatches traffic to the rest of the stack. | 80            | `11904`           |
| **Next.js** (`app`)   | The web UI.                                                                 | 3000          | –                 |
| **Zero** (`zero`)     | [Zero server](https://zero.rocicorp.dev/)                                   | 4848          | –                 |
| **Ollama** (`ollama`) | Runs local LLMs. Starts without any model installed.                        | 11434         | –                 |
| **PostgreSQL** (`db`) | Relational database.                                                        | 5432          | `11905`           |

### Heads-up 🚧

Liqua's self-hosting flow is still young and may have a few rough edges:

- **Public-facing deploys:** Hosting Liqua behind your own domain with HTTPS currently requires you to generate SSL certificates and manually tweak `nginx.conf`. These settings are _not yet_ configurable via `liqua.config.json`, but they will be in the future.
- **Ollama models & GPU:** The Ollama container starts empty and runs on CPU. Install models with `ollama pull <model>` inside the container. GPU acceleration and model pre-configuration will hopefully be managed through `liqua.config.json` as well in the future.

If you hit any snags, please [open an issue](https://github.com/simonecervini/liquachat/issues) – feedback is hugely appreciated!

## Getting Started: Development Environment

This section describes how to set up a local development environment to contribute to Liqua.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/en) (v20) and [pnpm](https://pnpm.io/installation)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/simonecervini/liquachat.git
    cd liquachat
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Configure environment variables:**
    Copy the `env.example` file to a new `.env` file. This file contains the necessary environment variables for development.

    ```bash
    cp .env.example .env
    ```

4.  **Start the database:**
    This command starts a detached PostgreSQL container using Docker.

    ```bash
    pnpm run db:dev
    ```

    You can see the running container with `docker ps`. Refer to the Docker documentation for more info on managing containers.

5.  **Run database migrations:**
    This command applies the database schema using Drizzle ORM.

    ```bash
    pnpm run db:push
    ```

6.  **Start the sync engine:**
    In a new terminal tab, start the Zero cache server.

    ```bash
    pnpm run zero:dev
    ```

7.  **Start the application:**
    In another terminal tab, start the Next.js development server.

    ```bash
    pnpm dev
    ```

8.  **Access the application:**
    Once all services are running, you can access Liqua at `http://localhost:3000`.

9.  **(Optional) Run Local Models with Ollama**
    If you want to test local models (e.g., `deepseek-r1:8b`, which requires ~16GB of RAM), you can run them on your machine using Ollama. After installing Ollama, run:
    ```bash
    ollama run deepseek-r1:8b
    ```

## License

This project is licensed under the terms of the [MIT license](./LICENSE).
