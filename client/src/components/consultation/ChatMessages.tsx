import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Download } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ChatMessagesProps {
  consultationId: number;
  userId: number;
  lawyerId: number;
  initialMessages?: Message[];
}

interface Message {
  id: number | string;
  senderId: number;
  content: string;
  timestamp: string;
  type: "text" | "file";
  fileUrl?: string;
  fileName?: string;
}

const ChatMessages = ({ consultationId, userId, lawyerId, initialMessages = [] }: ChatMessagesProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socketRef.current = new WebSocket(wsUrl);
    
    socketRef.current.onopen = () => {
      console.log("WebSocket connection established for chat");
      // Join the consultation room
      socketRef.current?.send(JSON.stringify({
        type: "join",
        consultationId,
        userId
      }));
    };
    
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "newMessage" && data.message) {
          setMessages(prevMessages => [...prevMessages, data.message]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to the chat server",
        variant: "destructive"
      });
    };
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [consultationId, userId, toast]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const messageData = {
      type: "message",
      consultationId,
      userId,
      content: newMessage,
      messageType: "text"
    };
    
    socketRef.current?.send(JSON.stringify(messageData));
    
    // Optimistically add the message to the UI
    const newMsg: Message = {
      id: uuidv4(),
      senderId: userId,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text"
    };
    
    setMessages(prevMessages => [...prevMessages, newMsg]);
    setNewMessage("");
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      handleFileUpload(e.target.files[0]);
    }
  };
  
  const handleFileUpload = (file: File) => {
    // In a real app, you would upload the file to a server here
    // For now, we'll just create a local object URL
    const fileUrl = URL.createObjectURL(file);
    
    const messageData = {
      type: "message",
      consultationId,
      userId,
      content: `Shared a file: ${file.name}`,
      messageType: "file",
      fileUrl,
      fileName: file.name
    };
    
    socketRef.current?.send(JSON.stringify(messageData));
    
    // Optimistically add the message to the UI
    const newMsg: Message = {
      id: uuidv4(),
      senderId: userId,
      content: `Shared a file: ${file.name}`,
      timestamp: new Date().toISOString(),
      type: "file",
      fileUrl,
      fileName: file.name
    };
    
    setMessages(prevMessages => [...prevMessages, newMsg]);
    
    toast({
      title: "File shared",
      description: `${file.name} has been shared successfully.`
    });
  };
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${
              message.senderId === userId
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.senderId === userId
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.type === "text" ? (
                message.content
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span>{message.fileName}</span>
                  </div>
                  <Button
                    variant="link"
                    className={`h-auto p-0 ${
                      message.senderId === userId ? "text-white" : "text-blue-600"
                    } underline`}
                    onClick={() => window.open(message.fileUrl, "_blank")}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                </div>
              )}
              <div
                className={`mt-1 text-xs ${
                  message.senderId === userId
                    ? "text-blue-100"
                    : "text-gray-500"
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      
      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <label
            htmlFor="file-upload"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100"
          >
            <Paperclip className="h-5 w-5 text-gray-500" />
          </label>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[40px] flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="h-10 w-10 rounded-full p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;