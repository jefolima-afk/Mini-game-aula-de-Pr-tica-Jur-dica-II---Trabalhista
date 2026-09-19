import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Radio } from 'lucide-react';
import { ChatMessage, OnlinePlayer } from '../types';

interface OnlineChatDrawerProps {
  messages: ChatMessage[];
  myPlayer: OnlinePlayer | null;
  onSendMessage: (text: string) => void;
}

export const OnlineChatDrawer: React.FC<OnlineChatDrawerProps> = ({
  messages,
  myPlayer,
  onSendMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [lastReadCount, setLastReadCount] = useState(messages.length);

  const unreadCount = isOpen ? 0 : Math.max(0, messages.length - lastReadCount);

  const handleOpen = () => {
    setIsOpen(true);
    setLastReadCount(messages.length);
  };

  const handleClose = () => {
    setIsOpen(false);
    setLastReadCount(messages.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        id="btn-open-chat"
        onClick={isOpen ? handleClose : handleOpen}
        title="Abrir Bate-Papo da Turma"
        className="fixed bottom-4 right-4 z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/25 border border-amber-300/40 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
      >
        <MessageSquare className="w-4 h-4 fill-slate-950" />
        <span className="hidden sm:inline">Bate-Papo da Turma</span>
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[10px] animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            className="fixed bottom-16 right-4 z-40 w-80 sm:w-88 h-96 bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-white font-display">
                  Bate-Papo • Turma Online
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {messages.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-8">
                  Nenhuma mensagem ainda. Envie uma mensagem para incentivar os colegas!
                </p>
              ) : (
                messages.map((m) => {
                  const isMe = myPlayer && m.playerId === myPlayer.id;
                  return (
                    <div
                      key={m.id}
                      className={`p-2 rounded-xl text-xs ${
                        m.isSystem
                          ? 'bg-slate-800/40 border border-slate-800 text-slate-400 text-[11px] italic'
                          : isMe
                          ? 'bg-amber-500/15 border border-amber-400/30 ml-4'
                          : 'bg-slate-800/70 border border-slate-750 mr-4'
                      }`}
                    >
                      {!m.isSystem && (
                        <div className="flex items-center justify-between text-[10px] mb-0.5 font-bold">
                          <span className="flex items-center gap-1 text-slate-200">
                            <span>{m.playerAvatar}</span>
                            <span style={{ color: m.playerColor || '#F59E0B' }}>
                              {m.playerName} {isMe ? '(Você)' : ''}
                            </span>
                          </span>
                          <span className="text-slate-500 font-normal">{m.timestamp}</span>
                        </div>
                      )}
                      <p className="text-slate-300 break-words leading-relaxed">{m.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enviar mensagem para a turma..."
                maxLength={100}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
