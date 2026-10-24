export declare const DEFAULT_MCP_ENDPOINT: "https://unifiedreading.com/mcp";

export interface StdioBridgeOptions {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  fetch?: typeof fetch;
  endpoint?: string;
  userAgent?: string;
}

/** Run a stdio MCP server that forwards to the remote Unified Reading server. Resolves when stdin closes. */
export declare function runStdioBridge(options?: StdioBridgeOptions): Promise<void>;
