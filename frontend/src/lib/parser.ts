import init, { parse_chat } from '@rust-parser/pkg';

let wasmInitialized = false;

export async function initParser(): Promise<void> {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

export function parseWhatsAppExport(text: string): WhatsAppMessage[] {
  if (!wasmInitialized) throw new Error("WASM parser not initialized");
  const result = parse_chat(text);
  return result.map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.timestamp), // Convert string to Date
  }));
}