import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createUser, createTask, updateTask } from "./fn";
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
  "Create a new user in file",
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

server.tool(
  "Create-task",
  "Create a new task in db",
  {
    title: z.string(),
    description: z.string(),
  },
  {
    title: "Create an User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  //@ts-ignore
  async (params) => {
    try {
      const id = await createTask(params);
      return {
        content: [{ type: "text", text: `Task created with ID: ${id}` }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: "failed to save task in db",
            error: String(err),
          },
        ],
      };
    }
  },
);

server.tool(
  "update-task",
  "update task in db",
  {
    title: z.string(),
    description: z.string(),
  },
  {
    title: "Create an User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  //@ts-ignore
  async (params) => {
    try {
      const id = await updateTask(params);
      return {
        content: [{ type: "text", text: `Task updated with ID: ${id}` }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: "failed to save updated task in db",
            error: String(err),
          },
        ],
      };
    }
  },
);

server.resource(
  "users",
  "users://all",
  {
    description: "Get all users data from the database",
    title: "Users",
    mimeType: "application/json",
  },
  async (uri) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((m) => m.default);

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(users),
          mimeType: "application/json",
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
