
import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isError = message.type === 'error';

  const bubbleClasses = `
    p-3 rounded-xl max-w-[85%] sm:max-w-[75%] shadow-sm transition-all duration-200 ease-in-out
    ${isUser
      ? 'bg-indigo-500 text-white self-end rounded-br-none ml-auto'
      : isError
        ? 'bg-red-100 text-red-800 self-start rounded-bl-none mr-auto border border-red-300'
        : 'bg-white text-gray-800 self-start rounded-bl-none mr-auto border border-gray-200'
    }
  `;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={bubbleClasses}>
        <p className="text-sm sm:text-base whitespace-pre-wrap">{message.text}</p>
        {message.groundingUrls && message.groundingUrls.length > 0 && (
          <div className="mt-2 text-xs text-gray-600 border-t border-gray-200 pt-2">
            <p className="font-semibold mb-1">Sources:</p>
            <ul className="list-disc list-inside space-y-1">
              {message.groundingUrls.map((url, index) => (
                <li key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline hover:text-indigo-700"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export { MessageBubble };
