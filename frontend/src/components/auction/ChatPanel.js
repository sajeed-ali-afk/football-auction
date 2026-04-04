import React, { useState, useRef, useEffect } from 'react';
import { generateAvatar, timeAgo } from '../../utils/helpers';
import { sounds } from '../../utils/sounds';

export default function ChatPanel({ messages = [], onSend, myUsername }) {
  const [msg, setMsg] = useState('');
  const bottomRef = useRef(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (messages.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (messages[messages.length - 1]?.username !== myUsername) {
        sounds.chat();
      }
    }
    prevLen.current = messages.length;
  }, [messages, myUsername]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg('');
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)', height: '300px' }}>
      <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
        <h3 className="font-display text-sm tracking-widest text-gray-400">💬 CHAT</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-4">Chat starts here!</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.username === myUsername ? 'flex-row-reverse' : ''}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-dark-500 flex-shrink-0"
                style={{ background: generateAvatar(m.username) }}>
                {m.username?.[0]?.toUpperCase()}
              </div>
              <div className={`max-w-[70%] ${m.username === myUsername ? 'items-end' : 'items-start'} flex flex-col`}>
                {m.username !== myUsername && (
                  <span className="text-xs text-gray-500 mb-0.5 ml-1">{m.username}</span>
                )}
                <div className="chat-bubble text-sm break-words"
                  style={m.username === myUsername ? { background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' } : {}}>
                  {m.message}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-white/5 flex-shrink-0">
        <input
          type="text"
          className="input-dark flex-1 text-sm py-2"
          placeholder="Type a message..."
          value={msg}
          onChange={e => setMsg(e.target.value)}
          maxLength={200}
        />
        <button type="submit" disabled={!msg.trim()}
          className="px-3 py-2 rounded-xl text-neon-green disabled:opacity-30 transition-all hover:bg-neon-green/10"
          style={{ border: '1px solid rgba(0,255,135,0.3)' }}>
          ↑
        </button>
      </form>
    </div>
  );
}
