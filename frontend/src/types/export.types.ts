export interface ExportOptions {
  include_media: boolean;
  include_system_messages: boolean;
  redact_mode: boolean;
  redacted_users: string[];
  start_date: string;
  end_date: string;
  style: 'whatsapp' | 'minimal' | 'print';
  page_size: 'a4' | 'letter' | 'legal';
  include_sentiment: boolean;
  include_qr_codes: boolean;
}