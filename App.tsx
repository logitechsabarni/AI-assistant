
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Message } from './types';
import { GeminiService } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

  const initializeGeminiService = useCallback(() => {
    try {
      setGeminiService(new GeminiService());
      console.log("GeminiService initialized.");
    } catch (error) {
      console.error("Failed to initialize GeminiService:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: `Error: GeminiService failed to initialize. Make sure API_KEY is set.`,
          sender: 'ai',
          type: 'error',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    initializeGeminiService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      text: text,
      sender: 'user',
      type: 'text',
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    if (!geminiService) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: `Error: GeminiService is not initialized. Cannot send message.`,
          sender: 'ai',
          type: 'error',
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const stream = geminiService.sendMessageStream(text);
      let fullResponseText = '';
      let currentGroundingUrls: string[] = [];

      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponseText += chunk.text;
        }
        if (chunk.groundingUrls && chunk.groundingUrls.length > 0) {
          currentGroundingUrls = Array.from(new Set([...currentGroundingUrls, ...chunk.groundingUrls]));
        }

        setMessages((prevMessages) => {
          const existingAiMessageIndex = prevMessages.findIndex(
            (msg) => msg.sender === 'ai' && (msg.type === 'text' || msg.type === 'grounded-text') && msg.id === 'streaming-ai-response'
          );

          const aiMessage: Message = {
            id: 'streaming-ai-response',
            text: fullResponseText,
            sender: 'ai',
            type: currentGroundingUrls.length > 0 ? 'grounded-text' : 'text',
            groundingUrls: currentGroundingUrls,
          };

          if (existingAiMessageIndex > -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[existingAiMessageIndex] = aiMessage;
            return updatedMessages;
          } else {
            return [...prevMessages, aiMessage];
          }
        });
      }

      setMessages((prevMessages) => {
        return prevMessages.map((msg) =>
          msg.id === 'streaming-ai-response' ? { ...msg, id: `ai-${Date.now()}` } : msg
        );
      });

    } catch (error: any) {
      console.error('Error sending message to Gemini:', error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.message.includes('API_KEY')) {
        errorMessage = 'API Key is invalid or not configured. Please ensure process.env.API_KEY is correct and has billing enabled for advanced features like Maps/Search grounding.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Requested entity was not found. Please try re-initializing or check your API key/model configuration.';
        // Attempt to re-initialize GeminiService in case of a lost session/API key issue
        initializeGeminiService();
      } else {
        errorMessage = `Error: ${error.message || 'Unknown error'}`;
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `error-${Date.now()}`,
          text: errorMessage,
          sender: 'ai',
          type: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [geminiService, initializeGeminiService]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-2xl">
      <header className="flex items-center justify-between p-4 sm:p-6 bg-indigo-600 text-white shadow-md rounded-t-lg">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M16.364 16.364l-.707.707M2.929 7.364l.707-.707M3 12H2m1.636 6.364l.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          AI Assistant
        </h1>
      </header>
      <main className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
            <svg className="w-16 h-16 mb-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            <p className="text-lg font-medium">How can I help you today?</p>
            <p className="text-sm mt-1">Ask me anything about current events, local businesses, or general knowledge.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id || index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-xl max-w-[70%] animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      <footer className="sticky bottom-0 p-4 sm:p-6 bg-white border-t border-gray-200 rounded-b-lg shadow-inner">
        <ChatInterface onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
}

export default App;
