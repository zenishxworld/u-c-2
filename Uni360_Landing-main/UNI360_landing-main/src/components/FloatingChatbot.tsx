/* Human assistant chatbot with professional avatar - Fully Responsive */
import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [mood, setMood] = useState("default");
  const [isMobile, setIsMobile] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Nick, your UNI 360° assistant. How can I help you with your study abroad journey today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      const promptInterval = setInterval(() => {
        const randomDelay = Math.random() * 15000 + 15000;
        setTimeout(() => {
          setShowPrompt(true);
          setTimeout(() => setShowPrompt(false), 4000);
        }, randomDelay);
      }, 30000);

      return () => clearInterval(promptInterval);
    }
  }, [isOpen]);

  // Handle click outside to close chatbot
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        const chatWindow = document.querySelector('[data-chatbot-window]');
        const chatButton = document.querySelector('[data-chatbot-button]');
        
        if (chatWindow && chatButton) {
          const isClickInsideWindow = chatWindow.contains(event.target);
          const isClickOnButton = chatButton.contains(event.target);
          
          if (!isClickInsideWindow && !isClickOnButton) {
            handleClose();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsClosing(false);
    setMood("help");
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: message,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);
    setMood("wait");

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Thanks! I'll help you with that shortly. In the meantime, you can check our guides or ask another question.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
      setMood("help");
    }, 1500);
  };

  const promptMessages = [
    "Need help? I'm here! 👋",
    "Got questions? Ask me! 🤔",
    "Ready to help you! ✨",
    "Hi there! How can I assist? 😊",
  ];

  const getRandomPrompt = () => {
    return promptMessages[Math.floor(Math.random() * promptMessages.length)];
  };

  // Human avatar component using actual image
  const HumanAvatar = ({ size = "w-16 h-16" }) => (
    <div className={`relative ${size} rounded-full border-2 border-white shadow-lg overflow-hidden bg-gray-100`}>
      <img 
        src="/human-chatbot.jpg" 
        alt="Nick - Study Abroad Assistant"
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          // Fallback to gradient background if image fails to load
          // e.target.style.display = 'none';
          // e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          // e.target.parentElement.innerHTML += '<div class="flex items-center justify-center w-full h-full text-white font-bold text-lg">N</div>';
        }}
      />
    </div>
  );

  return (
    <>
      {/* Chatbot positioned responsively */}
      <div className={`fixed z-50 ${
        isMobile 
          ? 'bottom-4 right-4' 
          : 'bottom-6 right-6 md:bottom-6 md:right-6'
      }`}>
        {/* Prompt message - responsive positioning */}
        {showPrompt && !isOpen && (
          <div className={`absolute mb-2 bg-white shadow-lg rounded-2xl px-3 py-2 border border-gray-200 animate-bounce max-w-xs ${
            isMobile 
              ? 'bottom-20 right-0 text-xs' 
              : 'bottom-24 right-0 text-sm'
          }`}>
            <div className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
              {getRandomPrompt()}
            </div>
            <div className="absolute bottom-0 right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white transform translate-y-full"></div>
          </div>
        )}

        {/* Chat button - responsive sizing with toggle functionality and no focus ring */}
        <button
          onClick={handleToggle}
          data-chatbot-button
          className={`group relative rounded-full hover:scale-105 transition-all duration-300 focus:outline-none ${
            isMobile ? 'p-1' : 'p-2'
          }`}
          aria-label={isOpen ? "Close chat" : "Chat with Nick - Study Abroad Assistant"}
        >
          <div className="animate-float animate-pulse">
            <HumanAvatar size={isMobile ? 'w-14 h-14' : 'w-16 h-16'} />
          </div>
        </button>

        {/* Chat window - fully responsive */}
        {isOpen && (
          <div className={`fixed bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${
            isClosing ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
          } ${
            isMobile 
              ? 'bottom-20 right-4 left-4 h-80 max-w-full' // Mobile: full width with margins, shorter height
              : 'bottom-24 right-4 w-80 h-96' // Desktop: fixed width
          }`}
          data-chatbot-window
          >
            
            {/* Header - responsive */}
            <div className="bg-gradient-to-r from-[#2C3539] to-[#1e2428] text-white px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HumanAvatar size={isMobile ? 'w-8 h-8' : 'w-10 h-10'} />
                  <div className="min-w-0 flex-1">
                    <div className={`font-semibold text-white truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Nick - UNI 360°
                    </div>
                    <div className={`text-white/80 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <span className="truncate">Online & Ready to Help</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-all duration-200 p-1 hover:bg-white/10 rounded-full hover:rotate-90 transform flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages area - responsive scrolling */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gradient-to-b from-gray-50/50 to-white/50 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`flex items-start gap-1.5 max-w-[90%] ${msg.isBot ? "" : "flex-row-reverse"}`}>
                    {msg.isBot && (
                      <div className="flex-shrink-0 mt-1">
                        <HumanAvatar size="w-5 h-5" />
                      </div>
                    )}
                    <div className={`px-2.5 py-1.5 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                      msg.isBot
                        ? "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md"
                    }`}>
                      <p className={`leading-relaxed break-words ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {msg.text}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start items-start gap-1.5">
                  <div className="flex-shrink-0 mt-1">
                    <HumanAvatar size="w-5 h-5" />
                  </div>
                  <div className="bg-white border border-gray-200 px-2.5 py-1.5 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nick is typing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input area - responsive with no-zoom fix for iOS */}

            <div className="p-2 bg-white/80 backdrop-blur-sm border-t border-gray-100">
  <div className="flex gap-2 items-end">
    <div className="flex-1 relative min-w-0">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask Nick about studying abroad..."
        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        className="pr-3 pl-3 py-2 rounded-full border-gray-200 bg-white/70 ios-no-zoom-input text-sm placeholder:text-sm"
      />
    </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isTyping}
                  className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #B8860B 100%)',
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive animations and styles with iOS zoom fix */}
      <style>
        {`
          @keyframes chatbot-float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.05); }
          }
          .animate-float {
            animation: chatbot-float 3s ease-in-out infinite;
          }

          /* Fix iOS Safari zoom on input focus */
          .ios-no-zoom-input {
            font-size: 16px !important;
            transform-origin: left top;
          }
          
          /* Ensure consistent input styling across devices */
          .ios-no-zoom-input::placeholder {
            font-size: 16px !important;
            opacity: 0.6;
          }

          /* Mobile specific adjustments */
          @media (max-width: 640px) {
            .ios-no-zoom-input {
              font-size: 16px !important;
            }
            
            .chatbot-mobile {
              max-width: calc(100vw - 2rem) !important;
              max-height: calc(100vh - 8rem) !important;
            }
          }

          /* Very small screens */
          @media (max-width: 380px) {
            .ios-no-zoom-input {
              font-size: 16px !important;
            }
            
            .chatbot-mobile {
              max-width: calc(100vw - 1rem) !important;
              left: 0.5rem !important;
              right: 0.5rem !important;
            }
          }

          /* Prevent zoom on all iOS devices */
          @media screen and (-webkit-min-device-pixel-ratio: 1) {
            select,
            textarea,
            input[type="text"],
            input[type="password"],
            input[type="datetime"],
            input[type="datetime-local"],
            input[type="date"],
            input[type="month"],
            input[type="time"],
            input[type="week"],
            input[type="number"],
            input[type="email"],
            input[type="url"],
            input[type="search"],
            input[type="tel"],
            input[type="color"] {
              font-size: 16px !important;
            }
          }

          /* Additional iOS Safari specific fixes */
          @supports (-webkit-overflow-scrolling: touch) {
            .ios-no-zoom-input {
              font-size: 16px !important;
              zoom: 1;
            }
          }
        `}
      </style>
    </>
  );
};