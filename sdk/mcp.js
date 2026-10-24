import { createInterface } from "node:readline";

export const DEFAULT_MCP_ENDPOINT = "https://unifiedreading.com/mcp";

/**
 * A stdio MCP server that forwards each newline-delimited JSON-RPC message to
 * the stateless remote server and writes its reply back. For MCP clients that
 * only launch local commands. Nothing is logged or stored.
 */
export function runStdioBridge({
  input = process.stdin,
  output = process.stdout,
  fetch = globalThis.fetch,
  endpoint = DEFAULT_MCP_ENDPOINT,
  userAgent = "unified-reading-mcp-stdio",
} = {}) {
  const write = (message) => output.write(`${JSON.stringify(message)}\n`);
  const pending = new Set();
  const lines = createInterface({ input, crlfDelay: Infinity });

  const forward = async (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    }
    const ids = (Array.isArray(message) ? message : [message]).map((m) => m?.id).filter((id) => id !== undefined);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "User-Agent": userAgent },
        body: line,
      });
      if (response.status === 202) return; // Notifications only.
      const text = await response.text();
      // The remote server answers with plain JSON, also for its own errors (e.g. 429).
      if (text.trim()) return write(JSON.parse(text));
      throw new Error(`Empty ${response.status} response`);
    } catch (error) {
      for (const id of ids) write({ jsonrpc: "2.0", id, error: { code: -32603, message: `Unified Reading MCP server unreachable: ${error.message}` } });
    }
  };

  lines.on("line", (line) => {
    if (!line.trim()) return;
    const task = forward(line).finally(() => pending.delete(task));
    pending.add(task);
  });
  return new Promise((resolve) => lines.on("close", () => Promise.all(pending).then(resolve)));
}
