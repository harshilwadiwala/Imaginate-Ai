import { useMemo } from "react";
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { FaGripLines } from "react-icons/fa";
import { FaPenToSquare, FaDownload, FaPlus, FaBars } from "react-icons/fa6";
import { IoSettingsSharp } from "react-icons/io5";
import { BsSendFill } from "react-icons/bs";
import { RiCheckboxBlankFill } from "react-icons/ri";

import roboLogo from "./assets/robo-logo.jpg";
import imaginate from "./assets/imaginateLogo.png";



const App = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [showSettings, setShowSettings] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  

const chatHistory = useMemo(() => {
  return chats.find((c) => c.id === activeChatId)?.history || [];
}, [chats, activeChatId]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) setUploadedImage(file);
  };

  const handleImageDownload = async (url, filename = "generated-image.jpg") => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Failed to download image.");
    }
  };

  const startNewChat = () => {
    const newChatId = chats.length > 0 ? Math.max(...chats.map((c) => c.id)) + 1 : 1;
    const newChat = { id: newChatId, name: "New Chat", history: [] };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

 const sendMessage = async () => {
    if ((!userInput.trim() && !uploadedImage) || isLoading) return;
    setLoading(true);
    
    const currentInput = userInput.trim();
    let currentActiveChatId = activeChatId;

    // 1. Logic to create a new chat if none is active
   if (!currentActiveChatId) {
  currentActiveChatId = chats.length > 0
    ? Math.max(...chats.map((c) => c.id)) + 1
    : 1;

  const newChat = { 
    id: currentActiveChatId,
    name: "New Chat",   // ✅ IMPORTANT
    history: [] 
  };

  setChats([newChat, ...chats]);
  setActiveChatId(currentActiveChatId);
}


    // 2. Logic to update the name of an existing "New Chat" if it's the first message
    const getChatTitle = (text) => {
  if (!text) return "New Chat";

  const stopWords = [
    "who", "what", "when", "where", "why", "how",
    "is", "was", "are", "were", "the", "a", "an",
    "of", "to", "in", "for", "on", "with", "do", "does"
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => !stopWords.includes(word));

  if (words.length === 0) return "New Chat";

  const titleWords = words.slice(0, 4);

  return titleWords
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};


    const userMsg = uploadedImage
      ? { role: "user", type: "image", content: URL.createObjectURL(uploadedImage) }
      : { role: "user", content: currentInput };

    // 3. Add the user message to history
    setChats(prev => prev.map(c => c.id === currentActiveChatId ? { ...c, history: [...c.history, userMsg] } : c));
    setChats(prev =>
  prev.map(chat =>
    chat.id === currentActiveChatId && chat.name === "New Chat"
      ? { ...chat, name: getChatTitle(currentInput) }
      : chat
  )
);

    setUserInput("");
    setUploadedImage(null);

    try {
      let response;
      const isImageReq = currentInput.toLowerCase().match(/(create|generate) image/);
      
      if (uploadedImage) {
        const formData = new FormData();
        formData.append("file", uploadedImage);
        formData.append("prompt", currentInput);
        response = await fetch("http://localhost:5000/image-chat", { method: "POST", body: formData });
      } else {
        const endpoint = isImageReq ? "generate-image" : "chat";
        response = await fetch(`http://localhost:5000/${endpoint}`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify(isImageReq ? { prompt: currentInput } : { message: currentInput }),
        });
      }

      const data = await response.json();
      const botText = data.response || data.text || "No response received";
      const botMsg = (isImageReq && data.imageUrl)
        ? { role: "bot", type: "image", content: data.imageUrl }
        : { role: "bot", content: botText };

      setChats(prev => prev.map(c => c.id === currentActiveChatId ? { ...c, history: [...c.history, botMsg] } : c));
    } catch (error) {
      setChats(prev => prev.map(c => c.id === currentActiveChatId ? { ...c, history: [...c.history, { role: "bot", content: "Error: AI not responding." }] } : c));
    } finally {
      setLoading(false);
    }
  };

  // ... (keep imports and state logic as is)

return (
  <div className={`Page-Container ${isSidebarOpen ? "sidebar-open" : ""} ${theme}-theme`}>
    {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

    <div
      className={`sidebar-wrapper ${isSidebarOpen ? "sidebar-open" : ""}`}
      onMouseEnter={() => window.innerWidth > 768 && setIsSidebarOpen(true)}
      onMouseLeave={() => window.innerWidth > 768 && !showSettings && setIsSidebarOpen(false)}
    >
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="menu-header">
          <div className="sidebar-item" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
             <FaGripLines className="icon" />
             <span className="sidebar-text" style={{fontWeight: 'bold'}}>Menu</span>
          </div>
        </div>

        <div className="sidebar-scrollable-content">
         <div className="sidebar-item new-chat-btn" onClick={startNewChat}>

            <FaPenToSquare className="icon" />
            <span className="sidebar-text">New Chat</span>
          </div>

         {chats.map((chat) => (
  <div
    key={chat.id}
    className={`sidebar-item chat-history-item ${chat.id === activeChatId ? "active" : ""}`}
    onClick={() => {
      setActiveChatId(chat.id);
      if (window.innerWidth <= 768) setIsSidebarOpen(false);
    }}
  >
    <FaPlus className="icon" style={{ fontSize: "0.7rem" }} />
    <span className="sidebar-text">{chat.name}</span>
  </div>
))}

        </div>

        <div className="sidebar-footer">
          {showSettings && isSidebarOpen && (
            <div className="settings-submenu">
              <div className="sidebar-item" onClick={() => setTheme("light")}>Light Mode</div>
              <div className="sidebar-item" onClick={() => setTheme("dark")}>Dark Mode</div>
            </div>
          )}
          <div className="sidebar-item" onClick={() => setShowSettings(!showSettings)}>
            <IoSettingsSharp className="icon" />
            <span className="sidebar-text">Settings</span>
          </div>
        </div>
      </div>
    </div>

    <div className="App">
      <header className="app-header">
        <div className="logo">
          {!isSidebarOpen && <FaBars className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} />}
          <img src={imaginate} alt="Logo" className="app-logo" />
          <h2 className="imaginate-text">Imaginate</h2>
        </div>
      </header>

      <div className="chat-window">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === "bot" ? (
              <div className="bot-row">
                <img src={roboLogo} className="robo-logo" alt="Bot" />
                <div className="bot-content">
                  {msg.type === "image" ? (
                    <div className="bot-image-wrapper">
                      <img src={msg.content} alt="AI Gen" style={{ maxWidth: '100%', borderRadius: '10px' }} />
                      <button onClick={() => handleImageDownload(msg.content)} className="download-btn"><FaDownload /></button>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="user-bubble-wrapper">
                {msg.type === "image" ? <img src={msg.content} alt="user" style={{ maxWidth: '200px' }} /> : <p>{msg.content}</p>}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="bot-row">
              <img src={roboLogo} className="robo-logo" alt="Bot" />
              <div className="thinking-spinner">
                <span className="thinking-dot"></span><span className="thinking-dot"></span><span className="thinking-dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input 
          className="text-input" 
          value={userInput} 
          onChange={(e) => setUserInput(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
          placeholder="Type a message..." 
        />
        <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
        <button className="icon-btn" onClick={() => fileInputRef.current.click()}><FaPlus /></button>
        <button className="send-btn" onClick={sendMessage} disabled={isLoading || !userInput.trim()}>
          {isLoading ? <RiCheckboxBlankFill /> : <BsSendFill />}
        </button>
      </div>
    </div>
  </div>
);
};

export default App;