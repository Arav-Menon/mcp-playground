import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";

const server = new McpServer({
  name: "test",
  version: "1.0.0",
});

server.tool(
  "add-two-numbers",
  "Adds two numbers together",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    return {
      content: [{ type: "text", text: String(a + b) }],
    };
  },
);

server.tool(
  "create-user",
  "Create a new user in a db",
  {
    name: z.string(),
    username: z.string(),
    email: z.string(),
  },
  {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async (params) => {
    try {
      const id = await createUser(params);

      return {
        content: [{ type: "text", text: `${id} created successfully` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: "failed to save user" }],
      };
    }
  },
);

async function createUser(user: {
  name: string;
  username: string;
  email: string;
}) {
  const users = await import("./data/users.json", {
    with: { type: "json" },
  }).then((m) => m.default);

  const id = users.length + 1;

  users.push({ id, ...user });

  await fs.writeFile("./data/users.json", JSON.stringify(users, null, 2));
  return id;
}

const transport = new StdioServerTransport();
await server.connect(transport);
