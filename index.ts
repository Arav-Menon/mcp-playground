import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createUser, createTask, updateTask } from "./fn";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
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

server.resource(
  "user-details",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  {
    description: "Get a user's details from teh database",
    title: "User Details",
    mimeType: "application/json",
  },
  async (uri, { userId }) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then(m => m.default)
    const user = users.find(u => u.id === parseInt(userId as string))

    if (user == null) {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({ error: "User not found" }),
            mimeType: "application/json",
          },
        ],
      }
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(user),
          mimeType: "application/json",
        },
      ],
    }
  }
)

server.prompt(
  "generate-fake-user",
  "Generate a fake user based on a given name",
  {
    name: z.string(),
  },
  ({ name }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a fake user with the name ${name}. The user should have a realistic email, address, and phone number.`,
          },
        },
      ],
    }
  }
)

server.tool(
  "create-random-user",
  "Create a random user with fake data",
  {
    title: "Create Random User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async () => {
    const res = await server.server.request(
      {
        method: "sampling/createMessage",
        params: {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: "Generate fake user data. The user should have a realistic name, email, address, and phone number. Return this data as a JSON object with no other text or formatter so it can be used with JSON.parse.",
              },
            },
          ],
          maxTokens: 1024,
        },
      },
      CreateMessageResultSchema
    )

    console.log(res)

    if (res.content.type !== "text") {
      return {
        content: [{ type: "text", text: "Failed to generate user data" }],
      }
    }

    try {
      const fakeUser = JSON.parse(
        res.content.text
          .trim()
          .replace(/^```json/, "")
          .replace(/```$/, "")
          .trim()
      )

      const id = await createUser(fakeUser)
      return {
        content: [{ type: "text", text: `User ${id} created successfully` }],
      }
    } catch {
      return {
        content: [{ type: "text", text: "Failed to generate user data" }],
      }
    }
  }
)

const transport = new StdioServerTransport();
await server.connect(transport);
