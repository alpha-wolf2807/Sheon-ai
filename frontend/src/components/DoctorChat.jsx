
import { useEffect, useState } from "react";
import axios from "axios";

export default function DoctorChat({ currentUser }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    axios.get("/api/users?role=doctor").then(res => setDoctors(res.data));
  }, []);

  const loadMessages = async () => {
    const res = await axios.get(`/api/chat/${currentUser}/${selectedDoctor}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    await axios.post("/api/chat/send", {
      sender: currentUser,
      receiver: selectedDoctor,
      message: text
    });
    setText("");
    loadMessages();
  };

  return (
    <div className="p-4 bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl">
      <select
        className="border p-2 mb-3 w-full"
        onChange={(e) => setSelectedDoctor(e.target.value)}
      >
        <option>Select Doctor</option>
        {doctors.map(doc => (
          <option key={doc._id} value={doc._id}>{doc.name}</option>
        ))}
      </select>

      <div className="h-40 overflow-y-auto bg-gray-100 p-2 rounded">
        {messages.map((m, i) => (
          <div key={i} className="mb-2">{m.message}</div>
        ))}
      </div>

      <input
        className="border p-2 w-full mt-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
      />
      <button
        onClick={sendMessage}
        className="mt-2 bg-teal-400 text-white px-4 py-2 rounded-xl hover:scale-105 transition"
      >
        Send
      </button>
    </div>
  );
}
