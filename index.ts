import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readonly, z } from "zod";

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
  async ( params ) => {
    return {};
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
