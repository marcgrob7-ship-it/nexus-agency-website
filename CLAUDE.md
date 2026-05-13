# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the agent (primary entry point)
npm start          # runs: tsx agent.ts

# Run the legacy JS version
node index.js
```

## Architecture

This project has two parallel implementations of a Composio+Claude agent:

### `agent.ts` (primary — TypeScript)
Uses the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) with Composio as an MCP server provider. Composio tools are exposed via `createSdkMcpServer` and passed into `query()`. The agent runs with `permissionMode: "bypassPermissions"`.

```
Composio (ClaudeAgentSDKProvider)
  └─ session.tools()         → Composio tool list
  └─ createSdkMcpServer()    → MCP server wrapping those tools
  └─ query({ mcpServers })   → Claude Agent SDK executes the prompt
```

### `index.js` (legacy — JavaScript)
Uses the **Anthropic SDK** directly (`@anthropic-ai/sdk`) with Composio tools fetched via REST API and passed as native tool definitions to `anthropic.messages.create()`.

## Environment

Requires a `.env` file with:
```
COMPOSIO_API_KEY=...
ANTHROPIC_API_KEY=...
```

The `agent.ts` uses a hardcoded `userId = "user_rexdt"` for the Composio session. Change this to switch between Composio user accounts/tool connections.

## Key Dependencies

- `@composio/core` + `@composio/claude-agent-sdk` — Composio integration layer
- `@anthropic-ai/claude-agent-sdk` — Agent SDK with MCP support (used in `agent.ts`)
- `@anthropic-ai/sdk` — Direct Anthropic API client (used in `index.js`)
- `tsx` — TypeScript execution without separate compile step (ESNext modules)

## TypeScript Config

Strict mode, ESNext modules, `bundler` module resolution. Only `*.ts` files in the root are compiled. Output goes to `dist/` (not used at runtime since `tsx` runs directly).
