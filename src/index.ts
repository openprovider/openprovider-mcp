#!/usr/bin/env node
/**
 * Openprovider MCP server — single-tenant stdio entrypoint.
 *
 * Talks to exactly one Openprovider account, supplied through the environment:
 *
 *   OPENPROVIDER_USERNAME   your Openprovider login
 *   OPENPROVIDER_PASSWORD   that account's password
 *   OPENPROVIDER_BASE_URL   optional API base (defaults to the production API)
 *
 * Credentials are read from the environment and used only to obtain an API
 * token from Openprovider. They are never written to disk and never logged.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createOpenproviderClient } from './openprovider/client.js';
import { createOpenproviderTokenManager } from './openprovider/token-manager.js';
import { buildTools } from './registry.js';
import type { Principal } from './auth/principal.js';
import { readFileSync } from 'node:fs';

function version(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const username = process.env.OPENPROVIDER_USERNAME;
const password = process.env.OPENPROVIDER_PASSWORD;
if (!username || !password) {
  process.stderr.write(
    'openprovider-mcp: OPENPROVIDER_USERNAME and OPENPROVIDER_PASSWORD must be set.\n' +
      'See the README for client configuration examples.\n',
  );
  process.exit(1);
}

const openproviderClient = createOpenproviderClient({
  ...(process.env.OPENPROVIDER_BASE_URL ? { baseUrl: process.env.OPENPROVIDER_BASE_URL } : {}),
});

// Single account, so the token cache is a single in-process slot.
let cached: { token: string; expiresAt: Date } | null = null;
const tokenManager = createOpenproviderTokenManager({
  fetchCredentials: () => Promise.resolve({ username, password }),
  cache: {
    get: () => Promise.resolve(cached),
    set: (_t, v) => {
      cached = v;
    },
    clear: () => {
      cached = null;
    },
  },
});

/**
 * The tool handlers take a Principal because the hosted multi-tenant build uses
 * it for tenant scoping and audit. Standalone there is exactly one identity, so
 * this is a fixed local value — it never grants access to anything beyond the
 * configured Openprovider account.
 */
const principal: Principal = {
  kind: 'service',
  tenantId: 'local',
  apiKeyId: 'local',
  subject: 'local',
  scopes: ['mcp:read', 'mcp:write'],
};

const tools = buildTools({ openproviderClient, tokenManager });
const byName = new Map(tools.map((t) => [t.name, t]));

const server = new Server(
  { name: 'openprovider-mcp', version: version() },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, () =>
  Promise.resolve({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: zodToJsonSchema(t.inputSchema as any) as Record<string, unknown>,
    })),
  }),
);

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = byName.get(req.params.name);
  if (!tool) {
    return {
      content: [{ type: 'text' as const, text: `Unknown tool: ${req.params.name}` }],
      isError: true,
    };
  }
  try {
    const result = await tool.handler(req.params.arguments ?? {}, principal);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    // Surface the real reason (Openprovider code + description) rather than a
    // generic failure — an opaque error here is very expensive to debug.
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
