import { ChatFile, ChatMessage, DateRange, ChatMetadata } from '../types/chat.types';
import { format, subDays, addDays } from 'date-fns';

// Generate a range of dates
const generateDateRange = (startDate: Date, days: number) => {
  const dates: string[] = [];
  
  for (let i = 0; i < days; i++) {
    dates.push(format(addDays(startDate, i), 'yyyy-MM-dd'));
  }
  
  return dates;
};

// Generate random messages for a given date
const generateMessages = (date: string, count: number, participants: string[]): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  
  for (let i = 0; i < count; i++) {
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const sender = participants[Math.floor(Math.random() * participants.length)];
    
    messages.push({
      id: `${date}_${i}`,
      chat_id: 'mock_chat_1',
      sender,
      time,
      date,
      text: generateMessageText(sender, i),
      timestamp: new Date(`${date}T${time}:00Z`).toISOString(),
      is_media: false,
      media_type: null,
      media_url: null,
      sentiment: Math.random() * 2 - 1  // Random sentiment between -1 and 1
    });
  }
  
  return messages;
};

// Generate message text
const generateMessageText = (sender: string, index: number): string => {
  const texts = [
    "Hey, how are you doing?",
    "I'm good, thanks! How about you?",
    "Did you see the news today?",
    "What time are we meeting tomorrow?",
    "Let's grab coffee sometime this week!",
    "I'm so excited about the weekend!",
    "Just finished that project we were talking about.",
    "Can you send me that file when you get a chance?",
    "Remember that funny thing that happened last week? 😂",
    "I miss our conversations!",
    "Just wanted to check in and see how you're doing.",
    "Let me know when you're free to talk.",
    "This made me think of you!",
    "Hope you're having a great day!",
    "Did you watch the latest episode?"
  ];
  
  return texts[index % texts.length];
};

// Generate date ranges with message counts
const generateDateRanges = (dates: string[]): DateRange[] => {
  return dates.map(date => ({
    date,
    message_count: 10 + Math.floor(Math.random() * 40),
    sentiment_avg: (Math.random() * 2 - 1) * 0.5  // Random sentiment between -0.5 and 0.5
  }));
};

// Generate mock chats
export const generateMockChats = (): ChatFile[] => {
  const today = new Date();
  const startDate = subDays(today, 30);
  
  return [
    {
      id: 'mock_chat_1',
      filename: 'Best Friends Group.txt',
      is_group_chat: true,
      participants: ['You', 'Alex', 'Jamie', 'Sam'],
      message_count: 350,
      upload_date: format(subDays(today, 2), 'yyyy-MM-dd'),
      date_range: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      }
    },
    {
      id: 'mock_chat_2',
      filename: 'Family Group.txt',
      is_group_chat: true,
      participants: ['You', 'Mom', 'Dad', 'Sister'],
      message_count: 230,
      upload_date: format(subDays(today, 5), 'yyyy-MM-dd'),
      date_range: {
        start: format(subDays(today, 45), 'yyyy-MM-dd'),
        end: format(subDays(today, 1), 'yyyy-MM-dd')
      }
    },
    {
      id: 'mock_chat_3',
      filename: 'Taylor.txt',
      is_group_chat: false,
      participants: ['You', 'Taylor'],
      message_count: 820,
      upload_date: format(subDays(today, 1), 'yyyy-MM-dd'),
      date_range: {
        start: format(subDays(today, 120), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      }
    }
  ];
};

// Generate mock data for a specific chat
export const generateMockChatData = (chatId: string): {
  metadata: ChatMetadata;
  dateRanges: DateRange[];
  messages: Record<string, ChatMessage[]>;
} => {
  const mockChats = generateMockChats();
  const mockChat = mockChats.find(chat => chat.id === chatId) || mockChats[0];
  
  const startDate = new Date(mockChat.date_range.start);
  const endDate = new Date(mockChat.date_range.end);
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const dates = generateDateRange(startDate, daysDiff);
  const dateRanges = generateDateRanges(dates);
  
  // Generate messages for the last 5 days
  const recentDates = dates.slice(-5);
  const messages: Record<string, ChatMessage[]> = {};
  
  recentDates.forEach(date => {
    const dateRange = dateRanges.find(dr => dr.date === date);
    if (dateRange) {
      messages[date] = generateMessages(date, dateRange.message_count, mockChat.participants);
    }
  });
  
  const metadata: ChatMetadata = {
    id: mockChat.id,
    filename: mockChat.filename,
    is_group_chat: mockChat.is_group_chat,
    participants: mockChat.participants,
    owner_participant: 'You',
    message_count: mockChat.message_count,
    first_message_date: mockChat.date_range.start,
    last_message_date: mockChat.date_range.end,
    upload_date: mockChat.upload_date
  };
  
  return {
    metadata,
    dateRanges,
    messages
  };
};