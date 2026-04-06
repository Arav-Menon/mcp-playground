# 🚀 MCP Testing Server

A high-performance, lightweight Model Context Protocol (MCP) server built with **Bun** and the **MCP SDK**. This project serves as a testing ground for implementing MCP tools that can be consumed by AI models (like Claude, Gemini, etc.) and integrated into IDEs like VS Code and Cursor.

## 🌟 Features

- **Built with Bun**: Leverages the fastest JavaScript runtime for minimal latency.
- **MCP SDK v1.29.0**: Fully compliant with the latest Model Context Protocol specifications.
- **Type-Safe Tools**: Uses `zod` for robust input validation.
- **Persistent Storage**: Includes a demo "database" (JSON-based) to demonstrate stateful tool interactions.
- **Native VS Code Support**: Pre-configured for the MCP VS Code extension.

## 🛠 Tools Provided

| Tool Name | Description | Inputs |
| ----------- | ----------- | ----------- |
| `add-two-numbers` | Performs basic arithmetic. | `a` (number), `b` (number) |
| `create-user` | Simulates user registration by saving to a local JSON file. | `name`, `username`, `email` |

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed on your system.a
- An MCP-compatible client (e.g., VS Code with MCP extension, Claude Desktop, or Cursor).

## 🚀 Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Server
The server uses standard input/output (stdio) for communication:
```bash
bun start
```

### 3. Inspect & Debug
Use the official MCP Inspector to test your tools in a web interface:
```bash
npm run server:inspect
```

## ⚙️ Configuration

### VS Code Integration
This project includes a `.vscode/mcp.json` file. If you have the MCP extension installed, you can point it to this configuration to automatically load the server.

### Manual MCP Client Setup
To add this server to an MCP client like Claude Desktop, add the following to your configuration file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "mcp-testing": {
      "command": "/path/to/bun",
      "args": ["run", "index.ts"],
      "cwd": "/path/to/mcp-testing"
    }
  }
}
```

## 📂 Project Structure

- `index.ts`: The main entry point where the MCP server is initialized and tools are defined.
- `data/users.json`: A local JSON storage for the `create-user` tool.
- `.vscode/mcp.json`: Configuration for VS Code MCP extension.

## 🧪 Development

If you want to add new tools:
1. Open `index.ts`.
2. Use `server.tool()` to define your tool name, description, and schema.
3. Use `zod` for input validation.
4. Restart the server or use a watch mode tool.

---

Built with ❤️ for the AI ecosystem.
