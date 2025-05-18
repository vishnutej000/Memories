import { WhatsAppMessage } from '@/types';

self.onmessage = (e: MessageEvent<{ text: string }>) => {
  const parsed: WhatsAppMessage[] = parseWhatsAppExport(e.data.text);
  self.postMessage(parsed);
};

// Helper function (mock for now)
function parseWhatsAppExport(text: string): WhatsAppMessage[] {
  return []; // Replace with actual parser
}