import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Sparkles,
  Send,
  Bot,
  MessageCircle,
  Zap,
  Globe,
  BookOpen,
  FileText,
  GraduationCap,
  User,
  ArrowRight,
  History,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const AskAI: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChat, setCurrentChat] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Mock user data
  const user = {
    name: "Harshanshu",
    email: "prisha@example.com",
    avatar: null,
  };

  const suggestedQuestions = [
    {
      category: "University",
      icon: GraduationCap,
      question: "How to shortlist universities for international applications?",
      color: "text-blue-600",
    },
    {
      category: "Documents",
      icon: FileText,
      question: "What documents are required for student visa applications?",
      color: "text-green-600",
    },
    {
      category: "Funding",
      icon: Zap,
      question: "How to calculate funding requirements for studying abroad?",
      color: "text-purple-600",
    },
    {
      category: "Testing",
      icon: BookOpen,
      question: "Which standardized tests should I take for my field?",
      color: "text-orange-600",
    },
    {
      category: "Applications",
      icon: MessageCircle,
      question: "How to write a compelling personal statement?",
      color: "text-indigo-600",
    },
    {
      category: "Deadlines",
      icon: Globe,
      question: "What are the application deadlines for top universities?",
      color: "text-red-600",
    },
  ];

  const handleNewChat = (): void => {
    const newChatId = Date.now();
    const newChat: Conversation = {
      id: newChatId,
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
    };
    setConversations((prev) => [newChat, ...prev]);
    setCurrentChat(newChat);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!input.trim()) return;

    let chatToUpdate = currentChat;

    if (!chatToUpdate) {
      const newChatId = Date.now();
      chatToUpdate = {
        id: newChatId,
        title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
      };
      setConversations((prev) => [chatToUpdate!, ...prev]);
      setCurrentChat(chatToUpdate);
    }

    const userMessage: Message = {
      id: Date.now(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...(chatToUpdate?.messages ?? []), userMessage];
    const updatedChat = { ...(chatToUpdate as Conversation), messages: updatedMessages };

    setCurrentChat(updatedChat);
    setConversations((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));

    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        content:
          "I'm here to help you with your study abroad journey! This is a demo response. In a real implementation, this would connect to an AI service to provide personalized guidance on university applications, visa processes, and more.",
        sender: "ai",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const finalChat = { ...updatedChat, messages: finalMessages };

      setCurrentChat(finalChat);
      setConversations((prev) => prev.map((c) => (c.id === finalChat.id ? finalChat : c)));
      setIsTyping(false);
    }, 900);
  };

  const handleSuggestedQuestion = (question: string): void => setInput(question);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") handleSendMessage();
  };

  const selectConversation = (conversation: Conversation): void => setCurrentChat(conversation);

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-subtle flex">
      {/* MAIN COLUMN */}
      <div className="flex-1 h-full px-4 py-4 max-w-4xl mx-auto overflow-hidden">
        {/* Top Navigation - Reduced size */}
        <div className="absolute top-4 left-24 z-10">
          <div className="text-foreground">
            <p className="text-base font-medium">Welcome, {user.name}</p>
          </div>
        </div>

        {!currentChat ? (
          // WELCOME SCREEN - Compact layout
          <div className="h-full flex flex-col gap-4 overflow-hidden pt-12">
            {/* Hero - Reduced spacing */}
            <div className="shrink-0 text-center max-w-2xl mx-auto px-2">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-2xl mb-3 shadow-float">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">Ask AI Assistant</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get instant, personalized guidance for your study abroad journey.
              </p>
            </div>

            {/* Suggested Questions - Compact grid */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 custom-scrollbar">
                {suggestedQuestions.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Card
                      key={index}
                      className={cn(
                        "p-3 cursor-pointer transition-all duration-300 ease-out",
                        "hover:shadow-float hover:scale-[1.02] hover:-translate-y-0.5",
                        "bg-gradient-glass backdrop-blur-xl border border-border/50",
                        "group relative overflow-hidden"
                      )}
                      onClick={() => handleSuggestedQuestion(item.question)}
                    >
                      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                      <div className="relative space-y-2">
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              "p-2 rounded-lg transition-all duration-200",
                              "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-105"
                            )}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground leading-snug group-hover:text-primary transition-colors duration-200">
                          {item.question}
                        </p>
                        <div className="flex items-center text-[10px] text-muted-foreground group-hover:text-primary/70 transition-colors">
                          <span>Click to ask</span>
                          <ArrowRight className="w-2.5 h-2.5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Input Section - Compact */}
            <div className="shrink-0 max-w-2xl mx-auto w-full space-y-2">
              <div
                className={cn(
                  "relative group",
                  "bg-gradient-glass backdrop-blur-xl border border-border/50",
                  "rounded-xl shadow-soft transition-all duration-300",
                  "p-1.5"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything about studying abroad..."
                      className={cn(
                        "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                        "text-sm px-3 py-2 placeholder:text-muted-foreground",
                        "rounded-lg h-9"
                      )}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim()}
                    size="sm"
                    className={cn(
                      "rounded-lg h-9 w-9 p-0 shrink-0",
                      "bg-primary hover:bg-primary/90",
                      "shadow-soft transition-all duration-300 ease-out",
                      "hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Powered by Advanced AI
              </p>
            </div>
          </div>
        ) : (
          // CHAT SCREEN - Very compact
          <div className="h-full">
            <Card className="h-full bg-gradient-glass backdrop-blur-xl border border-border/50 shadow-float rounded-xl overflow-hidden flex flex-col">
              {/* Header - Very small */}
              <div className="shrink-0 border-b border-border/50 p-2 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-foreground">{currentChat.title}</h2>
                    <p className="text-[10px] text-muted-foreground">AI Assistant</p>
                  </div>
                </div>
              </div>

              {/* Messages - Very compact */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                {currentChat.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-primary/10 rounded-lg flex items-center justify-center mx-auto">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Ready to help</p>
                        <p className="text-[10px] text-muted-foreground">Ask any question</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentChat.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-1.5 animate-in slide-in-from-bottom-1 duration-200",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender === "ai" && (
                          <div className="w-5 h-5 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
                            <Bot className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}

                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-2 py-1.5 shadow-sm",
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border"
                          )}
                        >
                          <p className="text-[11px] leading-relaxed">{message.content}</p>
                          <span className="text-[9px] opacity-70 mt-0.5 block">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {message.sender === "user" && (
                          <div className="w-5 h-5 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <User className="w-2.5 h-2.5 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-1.5 animate-in slide-in-from-bottom-1 duration-200">
                        <div className="w-5 h-5 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
                          <Bot className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="bg-card border border-border rounded-lg px-2 py-1.5 shadow-sm">
                          <div className="flex items-center gap-0.5">
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input - Very compact */}
              <div className="shrink-0 border-t border-border/50 p-2 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your question..."
                      disabled={isTyping}
                      className={cn(
                        "bg-gradient-glass backdrop-blur-xl border-border/50 rounded-md h-7",
                        "py-1.5 px-2 text-xs",
                        "focus:ring-1 focus:ring-primary/20 focus:border-primary",
                        "disabled:opacity-50"
                      )}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    size="sm"
                    className={cn(
                      "bg-primary hover:bg-primary/90 px-2 py-1.5 rounded-md shadow-sm h-7",
                      "transition-all duration-200 hover:scale-105",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Send className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - Compact */}
      <div className="w-64 h-screen border-l border-border/20 bg-card/30 backdrop-blur-xl p-4 space-y-4 overflow-hidden flex flex-col">
        <Button
          onClick={handleNewChat}
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 shadow-soft transition-all duration-200 hover:scale-105 shrink-0"
        >
          <Plus className="w-3 h-3 mr-2" />
          New Chat
        </Button>

        <div className="space-y-3 shrink-0">
          <div className="flex items-center gap-2 text-foreground">
            <History className="w-3 h-3 text-primary" />
            <h3 className="font-semibold text-sm">History</h3>
          </div>
          <div className="relative">
            <Input placeholder="Search history..." className="bg-background/50 border-border/50 rounded-lg text-xs h-8" />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No conversations yet</p>
              <p className="text-[10px]">Start your first chat!</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={cn(
                  "p-2 rounded-lg cursor-pointer transition-all duration-200",
                  "hover:bg-background/50 hover:scale-[1.01]",
                  "border border-transparent hover:border-border/50 mb-2",
                  currentChat?.id === conversation.id && "bg-primary/10 border-primary/20"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-foreground truncate flex-1">{conversation.title}</p>
                    <Clock className="w-2.5 h-2.5 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{conversation.createdAt.toLocaleDateString()}</p>
                  {conversation.messages.length > 0 && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {conversation.messages[conversation.messages.length - 1].content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-border/20 shrink-0">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>900 tokens left</span>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styling */}
      <style jsx global>{`
        html, body, #__next { height: 100%; overflow: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.3); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
      `}</style>
    </div>
  );
};

export default AskAI;