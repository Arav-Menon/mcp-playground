import { select, input, confirm } from "@inquirer/prompts";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CreateMessageRequestSchema, type PromptMessage, type Tool } from "@modelcontextprotocol/sdk/types.js";
import { OpenRouter } from "@openrouter/sdk";

const mcp = new Client(
  { name: "test-mcp", version: "1.0.0" },
  { capabilities: { sampling: {} } },
);

const transport = new StdioClientTransport({
  command: "/home/arav-menon/.bun/bin/bun",
  args: ["run", "server.ts"],
});

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

async function main() {
  mcp.setRequestHandler(CreateMessageRequestSchema, async (params) => {
    console.log("Sampling request received from server...");
    const chatResult = await openrouter.chat.send({
      chatRequest: {
        model: "arcee-ai/trinity-large-preview:free",
        //@ts-ignore
        messages: params.messages.map(m => ({
          role: m.role,
          content: m.content.type === "text" ? m.content.text : ""
        })),
        stream: false
      }
    });

    return {
      content: {
        type: "text",
        text: chatResult.choices[0]?.message.content ?? ""
      },
      model: "arcee-ai/trinity-large-preview:free",
      role: "assistant",
      stopReason: "endTurn"
    } as any;
  });

  await mcp.connect(transport);
  const [{ tools }, { prompts }, { resources }, { resourceTemplates }] =
    await Promise.all([
      mcp.listTools(),
      mcp.listPrompts(),
      mcp.listResources(),
      mcp.listResourceTemplates(),
    ]);
  console.log("You're connected");

  while (true) {
    const option = await select({
      message: "What would you like to do",
      choices: ["Query", "Tools", "Resources", "Prompts"],
    });
    switch (option) {
      case "Tools":
        const toolName = await select({
          message: "Select a tool",
          choices: tools.map((tool) => ({
            name: tool.annotations?.title || tool.name,
            value: tool.name,
            description: tool.description,
          })),
        });
        const tool = tools.find((t) => t.name == toolName);
        if (tool == null) {
          console.log("Tool not found");
        } else {
          await handleTool(tool);
        }
        break;

      case "Resources":
        const resourceUri = await select({
          message: "Select a resource",
          choices: [
            ...resources.map((resource) => ({
              name: resource.name,
              value: resource.uri,
              description: resource.description,
            })),
            ...resourceTemplates.map((template) => ({
              name: template.name,
              value: template.uriTemplate,
              description: template.description,
            })),
          ],
        });
        const uri =
          resources.find((r) => r.uri === resourceUri)?.uri ??
          resourceTemplates.find((r) => r.uriTemplate === resourceUri)
            ?.uriTemplate;
        if (uri == null) {
          console.error("Resource not found.");
        } else {
          await handleResource(uri);
        }
        break;

      case "Prompts":
        const promptName = await select({
          message: "Select a prompt",
          choices: prompts.map(prompt => ({
            name: prompt.name,
            value: prompt.name,
            description: prompt.description,
          })),
        })
        const prompt = prompts.find(p => p.name === promptName)
        if (prompt == null) {
          console.error("Prompt not found.")
        } else {
          await handlePrompt(prompt)
        }
        break

      case "Query":
        await handleQuery(tools)
    }

  }
}

async function handleQuery(tools: Tool[]) {
  const query = await input({ message: "Enter your query" });

  let messages: any[] = [{ role: "user", content: query }];
  const openRouterTools = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));

  try {
    while (true) {
      const response = await openrouter.chat.send({
        chatRequest: {
          model: "google/gemini-2.0-flash-001",
          messages,
          tools: openRouterTools,
        },
      });

      //@ts-ignore
      const message = response.choices[0].message;
      messages.push(message);

      //@ts-ignore
      if (message.tool_calls && message.tool_calls.length > 0) {
        //@ts-ignore
        for (const toolCall of message.tool_calls) {
          console.log(`Calling tool: ${toolCall.function.name}...`);
          const args = JSON.parse(toolCall.function.arguments);
          const result = await mcp.callTool({
            name: toolCall.function.name,
            arguments: args,
          });

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      if (message.content) {
        console.log("\nAssistant:", message.content);
      }
      break;
    }
  } catch (error) {
    console.error("Error during query:", error);
  }
}

async function handleTool(tool: Tool) {
  const args: Record<string, string> = {};
  for (const [key, value] of Object.entries(
    tool.inputSchema.properties ?? {},
  )) {
    args[key] = await input({
      message: `Enter value for ${key} (${(value as { type: string }).type}):`,
    });
  }

  const res = await mcp.callTool({
    name: tool.name,
    arguments: args,
  });

  console.log((res.content as [{ text: string }])[0].text);
}

async function handleResource(uri: string) {
  let finalUri = uri;
  const paramMatches = uri.match(/{([^}]+)}/g);

  if (paramMatches != null) {
    for (const paramMatch of paramMatches) {
      const paramName = paramMatch.replace("{", "").replace("}", "");
      const paramValue = await input({
        message: `Enter value for ${paramName}:`,
      });
      finalUri = finalUri.replace(paramMatch, paramValue);
    }
  }

  const res = await mcp.readResource({
    uri: finalUri,
  });

  console.log(
    //@ts-ignore
    JSON.stringify(JSON.parse(res.contents[0].text as string), null, 2),
  );
}

async function handlePrompt(prompt: any) {
  const args: Record<string, string> = {};
  for (const arg of prompt.arguments ?? []) {
    args[arg.name] = await input({
      message: `Enter value for ${arg.name}:`,
    });
  }

  const response = await mcp.getPrompt({
    name: prompt.name,
    arguments: args,
  });

  for (const message of response.messages) {
    const result = await handleServerMessagePrompt(message);
    if (result) {
      console.log("Result:", result);
      try {
        const cleanJson = result.trim().replace(/^```json/, "").replace(/```$/, "").trim();
        const userData = JSON.parse(cleanJson);
        if (userData.name && userData.username && userData.email) {
          const save = await confirm({
            message: `Generated user: ${userData.name} (${userData.username}). Do you want to save to users.json?`,
            default: true
          });
          if (save) {
            const res = await mcp.callTool({
              name: "create-user",
              arguments: userData
            });
            console.log("Save result:", (res.content as [{ text: string }])[0].text);
          }
        }
      } catch (e) {
        // Not a JSON user object, just continue
      }
    }
  }
}

async function handleServerMessagePrompt(message: PromptMessage) {
  if (message.content.type !== "text") return;

  console.log(message.content.text);
  const run = await confirm({
    message: "Would you like to run the above prompt",
    default: true,
  });

  if (!run) return;

  const chatResult = await openrouter.chat.send({
    chatRequest: {
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "user",
          content: message.content.text
        }
      ],
      stream: false
    }
  });

  return chatResult.choices[0]?.message.content;
}

main();
