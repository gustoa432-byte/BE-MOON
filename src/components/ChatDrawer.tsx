import React, { useState } from 'react';
import { Send, MapPin, ShieldCheck } from 'lucide-react';
import { Creator, WorkItem } from '../types';
import { BeMoonLogo } from './BeMoonLogo';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator | null;
  work?: WorkItem | null;
}

interface Message {
  id: string;
  sender: 'user' | 'creator';
  text: string;
  time: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  creator,
  work
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'creator',
      text: `Здравствуйте! Буду рад проконсультировать или обсудить заказ${work ? ` по работе «${work.title}»` : ''}.`,
      time: '12:04'
    }
  ]);

  if (!isOpen || !creator) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulated reply from master
    setTimeout(() => {
      const creatorReply: Message = {
        id: `msg-reply-${Date.now()}`,
        sender: 'creator',
        text: 'Спасибо за сообщение! Готов приступить к работе. Когда вам будет удобно встретиться в мастерской?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, creatorReply]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#0d0e12] text-white flex flex-col animate-in fade-in duration-200">
      {/* Top Floating Glass Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0d0e12]/95 border-b border-white/10 backdrop-blur-md">
        <div
          style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
          className="relative mx-auto max-w-2xl px-3 pb-3 flex items-center justify-between gap-3"
        >
          {/* Logo Anchor: Back */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Вернуться назад"
            className="group flex items-center transition-transform active:scale-95 cursor-pointer focus:outline-none flex-shrink-0"
          >
            <BeMoonLogo size={32} isBackAnchor />
          </button>

          {/* Master Interlocutor Details */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
            <div className="text-right min-w-0">
              <div className="text-xs font-bold text-white flex items-center justify-end gap-1 truncate">
                <span className="truncate">{creator.name}</span>
                {creator.verified && <ShieldCheck size={13} className="text-sky-400 flex-shrink-0" />}
              </div>
              <div className="text-[10px] text-neutral-400 truncate">
                {creator.role} · {creator.distanceText}
              </div>
            </div>
            <img src={creator.avatar} alt={creator.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20 flex-shrink-0" />
          </div>
        </div>

        {/* Work banner if opened from a specific work */}
        {work && (
          <div className="bg-neutral-900/90 px-4 py-2 flex items-center gap-2.5 border-t border-white/5 mx-auto max-w-2xl">
            <img src={work.image} alt={work.title} className="h-8 w-8 rounded-lg object-cover" />
            <div className="text-[11px] truncate flex-1 text-neutral-300">
              По поводу: <span className="font-semibold text-white">{work.title}</span>
            </div>
            <span className="text-[11px] font-bold text-white font-['Syne',sans-serif]">{work.priceFormatted}</span>
          </div>
        )}
      </header>

      {/* Message Thread Body */}
      <div className={`flex-1 overflow-y-auto px-4 ${work ? 'pt-32' : 'pt-20'} pb-24 mx-auto w-full max-w-2xl space-y-3`}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-white text-neutral-950 rounded-br-none shadow-md'
                  : 'bg-neutral-900 text-neutral-200 border border-white/5 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))' }}
        className="fixed inset-x-0 bottom-0 z-40 bg-[#0d0e12]/95 border-t border-white/10 p-3 backdrop-blur-md"
      >
        <form onSubmit={handleSend} className="mx-auto max-w-2xl flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите мастеру..."
            className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white border border-white/10"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-neutral-950 transition-all disabled:opacity-30 active:scale-95 shadow-md flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
