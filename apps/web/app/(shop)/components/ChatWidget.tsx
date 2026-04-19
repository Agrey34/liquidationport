'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: 'bot'|'user', text: string}[]>([
    { sender: 'bot', text: 'Hi there! How can we help you with your liquidation sourcing today?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages([...messages, { sender: 'user', text: inputValue }]);
    setInputValue('');

    // Mock bot reply
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Our support team will connect with you shortly. Please leave your email address if you need to step away.' }]);
    }, 1000);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 sm:bottom-6 right-6 h-14 w-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-accent transition-all z-50 transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" fill="currentColor" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-[136px] sm:bottom-24 right-6 w-80 sm:w-96 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Liquidation Port Support</h3>
              <p className="text-xs text-white/80">We typically reply in a few minutes.</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 h-80 overflow-y-auto bg-neutral-50 flex flex-col gap-3">
             {messages.map((msg, idx) => (
                <div key={idx} className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.sender === 'user' ? 'bg-primary text-white self-end rounded-br-sm' : 'bg-white border border-neutral-200 text-neutral-800 self-start rounded-bl-sm'}`}>
                   {msg.text}
                </div>
             ))}
          </div>

          {/* Input Area */}
          <form className="p-3 bg-white border-t border-neutral-200 flex gap-2" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Write a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-neutral-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-accent transition-colors"
            >
               <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
