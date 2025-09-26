export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
}
