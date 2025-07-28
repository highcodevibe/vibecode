import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef(null);

  // Generate a new temp email
  const generateEmail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/generate`, { method: 'POST' });
      const data = await res.json();
      setEmail(data.email);
      setExpiresAt(data.expiresAt);
      setMessages([]);
    } catch (e) {
      setError('Failed to generate email');
    }
    setLoading(false);
  };

  // Poll for messages
  useEffect(() => {
    if (!email) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${email}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMessages(data.messages);
      } catch {
        setMessages([]);
      }
    };
    fetchMessages();
    timer.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(timer.current);
  }, [email]);

  // Expiry countdown
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        setEmail('');
        setExpiresAt(null);
        setMessages([]);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Temp Mail Generator</h1>
        {!email ? (
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={generateEmail}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Temporary Email'}
          </button>
        ) : (
          <div>
            <div className="mb-2 text-center">
              <span className="font-mono text-lg bg-gray-200 px-2 py-1 rounded">{email}</span>
            </div>
            <div className="mb-4 text-center text-sm text-gray-500">
              Expires in: {timeLeft}s
            </div>
            <button
              className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition mb-4"
              onClick={generateEmail}
              disabled={loading}
            >
              Generate New Email
            </button>
            <h2 className="text-lg font-semibold mb-2">Inbox</h2>
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center">No messages yet.</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {messages.map((msg, i) => (
                  <li key={i} className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="text-xs text-gray-500">From: {msg.from}</div>
                    <div className="font-bold">{msg.subject}</div>
                    <div className="text-sm">{msg.body}</div>
                    <div className="text-xs text-gray-400 text-right">{new Date(msg.receivedAt).toLocaleTimeString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
      </div>
      <footer className="mt-8 text-gray-400 text-xs text-center">&copy; {new Date().getFullYear()} TempMail Prototype</footer>
    </div>
  );
}

export default App;
