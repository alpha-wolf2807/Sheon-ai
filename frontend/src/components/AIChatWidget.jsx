
import { useState } from "react";
import axios from "axios";

export default function AIChatWidget() {
  const [msg, setMsg] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    const res = await axios.post("/api/ai", { prompt: msg });
    setResponse(JSON.stringify(res.data));
  };

  return (
    <div className="fixed bottom-5 right-5 bg-white p-4 rounded-2xl shadow-xl">
      <textarea
        className="border p-2 w-full"
        placeholder="Ask AI about your health..."
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <button
        onClick={sendMessage}
        className="mt-2 bg-purple-400 text-white px-4 py-2 rounded-xl hover:scale-105 transition"
      >
        Ask AI
      </button>
      <div className="mt-2 text-sm">{response}</div>
    </div>
  );
}
