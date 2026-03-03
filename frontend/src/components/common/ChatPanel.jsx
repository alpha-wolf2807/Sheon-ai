import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

let socket;

export default function ChatPanel({ roomId, recipientId, recipientName, isDoctor = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    fetchMessages();
    
    socket = io('http://localhost:5000');
    socket.emit('join-room', roomId);
    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => { socket?.disconnect(); };
  }, [roomId]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/chat/${roomId}/messages`);
      setMessages(data.messages);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { setLoading(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      await axios.post(`/chat/${roomId}/send`, {
        message: newMsg.trim(),
        receiverId: recipientId,
        isUrgent: isDoctor && isUrgent
      });
      setNewMsg('');
      setIsUrgent(false);
    } catch {}
  };

  const isMyMessage = (msg) => msg.senderId?._id === user?._id || msg.senderId === user?._id;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 glass-surface">
        <div className="font-body font-medium">{recipientName}</div>
        <div className="text-xs text-white/40">{isDoctor ? 'Doctor' : 'Private Chat'}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-white/30 text-sm font-body mt-8">No messages yet. Start the conversation.</div>
        ) : messages.map((msg, i) => (
          <motion.div key={msg._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${isMyMessage(msg) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm font-body ${
              isMyMessage(msg) 
                ? 'text-white rounded-br-sm' 
                : 'text-white/90 rounded-bl-sm'
            } ${msg.isUrgent ? 'border border-red-400/30' : ''}`}
              style={{
                background: isMyMessage(msg) 
                  ? 'linear-gradient(135deg, #5B2EFF, #7A56FF)' 
                  : 'rgba(28,19,53,0.8)',
                border: isMyMessage(msg) ? 'none' : '1px solid rgba(200,162,255,0.1)'
              }}>
              {msg.isUrgent && <div className="text-red-400 text-xs flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> Urgent</div>}
              {msg.message}
              <div className="text-white/30 text-xs mt-1">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 glass-surface">
        {isDoctor && (
          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" id="urgent" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} className="accent-red-400" />
            <label htmlFor="urgent" className="text-xs text-white/60 font-body cursor-pointer">Mark as Urgent (triggers SMS)</label>
          </div>
        )}
        <div className="flex gap-2">
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
            className="input-field flex-1 py-2 text-sm" placeholder="Type a message..." />
          <button type="submit" className="btn-primary py-2 px-4 flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
