
import * as React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { streamChatResponse } from '../services/geminiService';
import type { Message, Conversation } from '../types';
import UserIcon from './icons/UserIcon';
import GeminiIcon from './icons/GeminiIcon';
import SendIcon from './icons/SendIcon';
import PlusIcon from './icons/PlusIcon';

const ChatView: React.FC = () => {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);

    const chatEndRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const wasLoading = React.useRef(false);

    React.useEffect(() => {
        try {
            const savedConversations = localStorage.getItem('chatConversations');
            if (savedConversations) {
                setConversations(JSON.parse(savedConversations));
            }
        } catch (error) {
            console.error("Failed to load or parse conversations from localStorage:", error);
            localStorage.removeItem('chatConversations');
        }
    }, []);

    React.useEffect(() => {
        if (wasLoading.current && !isLoading) {
            // Loading has just finished
            if (messages.length === 0) return;

            const updatedConversations = [...conversations];
            const currentConvoIndex = updatedConversations.findIndex(c => c.id === currentConversationId);
            
            if (currentConvoIndex !== -1) {
                // Update existing conversation
                updatedConversations[currentConvoIndex] = { ...updatedConversations[currentConvoIndex], messages };
            } else {
                // Create new conversation
                const newId = Date.now().toString();
                const newConversation: Conversation = {
                    id: newId,
                    title: messages[0].content.substring(0, 40) + (messages[0].content.length > 40 ? '...' : ''),
                    messages: messages,
                };
                updatedConversations.push(newConversation);
                setCurrentConversationId(newId);
            }

            setConversations(updatedConversations);
            localStorage.setItem('chatConversations', JSON.stringify(updatedConversations));
        }
        wasLoading.current = isLoading;
    }, [isLoading, messages, conversations, currentConversationId]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSendMessage = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, newUserMessage, { role: 'model', content: '' }]);
        const prompt = input;
        setInput('');
        setIsLoading(true);

        try {
            await streamChatResponse(prompt, (chunk) => {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.content += chunk;
                    }
                    return newMessages;
                });
            });
        } catch (error) {
            console.error(error);
             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.content = "An error occurred. Please try again.";
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading]);

    const handleNewChat = () => {
        setMessages([]);
        setCurrentConversationId(null);
    }

    const handleSelectConversation = (id: string) => {
        const conversation = conversations.find(c => c.id === id);
        if (conversation) {
            setMessages(conversation.messages);
            setCurrentConversationId(conversation.id);
        }
    };

    const renderMessageContent = (content: string) => {
        const codeBlockRegex = /```([\s\S]*?)```/g;
        const parts = content.split(codeBlockRegex);

        return parts.map((part, index) => {
            if (index % 2 === 1) {
                const codeLines = part.split('\n');
                const language = codeLines[0] || '';
                const codeContent = codeLines.slice(1).join('\n');
                return (
                    <div key={index} className="bg-black rounded-md my-2">
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-800 rounded-t-md">
                            <span className="text-gray-400 text-sm">{language}</span>
                            <button onClick={() => navigator.clipboard.writeText(codeContent)} className="text-gray-400 hover:text-white text-sm">Copy code</button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm"><code className="text-white">{codeContent}</code></pre>
                    </div>
                );
            }
            return part.split('\n').map((line, i) => <p key={i}>{line}</p>);
        });
    };

    return (
        <div className="flex h-screen bg-[#343541] text-white">
            <div className="w-64 bg-[#202123] p-2 flex flex-col hidden md:flex">
                <button onClick={handleNewChat} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-700/50 w-full text-sm">
                    <PlusIcon /> New chat
                </button>
                <div className="flex-grow mt-4 overflow-y-auto pr-2" aria-label="Chat history">
                    <div className="flex flex-col gap-2">
                        {[...conversations].reverse().map(convo => (
                            <button 
                                key={convo.id} 
                                onClick={() => handleSelectConversation(convo.id)}
                                className={`w-full text-left text-sm p-2 rounded-md truncate transition-colors ${currentConversationId === convo.id ? 'bg-gray-700/70' : 'hover:bg-gray-700/50'}`}
                            >
                                {convo.title}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="border-t border-gray-700 p-2">
                    <div className="p-2 rounded-md hover:bg-gray-700/50">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col relative">
                <main className="flex-1 overflow-y-auto pb-32">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                                Gemini
                            </div>
                            <h1 className="text-2xl text-gray-300">How can I help you today?</h1>
                        </div>
                    ) : (
                        <div className="">
                            {messages.map((msg, index) => (
                                <div key={index} className={`py-6 ${msg.role === 'model' ? 'bg-[#444654]/50' : ''}`}>
                                    <div className="max-w-3xl mx-auto flex gap-4 px-4 items-start">
                                        {msg.role === 'user' ? <UserIcon /> : <GeminiIcon />}
                                        <div className="prose prose-invert max-w-none text-white flex-1 pt-0.5">
                                            {renderMessageContent(msg.content)}
                                            {isLoading && msg.role === 'model' && index === messages.length - 1 && <span className="animate-pulse">▍</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </main>

                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#343541] via-[#343541] to-transparent">
                    <div className="max-w-3xl mx-auto px-4 pb-4">
                        <form onSubmit={handleSendMessage} className="relative">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e as any);
                                    }
                                }}
                                placeholder="Message Gemini..."
                                rows={1}
                                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-[#40414f] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none overflow-y-hidden"
                                style={{maxHeight: '200px'}}
                                aria-label="Chat input"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gray-800 disabled:bg-transparent group transition-colors"
                                aria-label="Send message"
                            >
                                <SendIcon disabled={!input.trim() || isLoading} />
                            </button>
                        </form>
                         <p className="text-xs text-center text-gray-500 pt-2">
                           Gemini may display inaccurate info, including about people, so double-check its responses.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatView;