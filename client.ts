import { select } from "@inquirer/prompts";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

const mcp = new Client(
  { name: "test-mcp", version: "1.0.0" },
  { capabilities: { sampling: {} } },
);

const transport = new StdioClientTransport({
  command: "/home/arav-menon/.bun/bin/bun",
  args: ["run", "index.ts"],
});

async function main() {
  await mcp.connect(transport);
  const [{ tools }, { prompts }, { resources }, { ResourceTemplates }] =
    await Promise.all([
      mcp.listTools(),
      mcp.listPrompts(),
      mcp.listResources(),
      mcp.listResourceTemplates(),
    ]);
  console.log("You're connected");

  while (true) {
    const toolName = await select({
      message: "What would you like to do",
      choices: ["Query", "tools", "Resources", "Prompts"],
    });
  }

  switch(option)

}

main();
