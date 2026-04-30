import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, Chat } from '@google/genai';
import { ChatMessage, BotResponse, FarmState } from '../types.ts';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';

interface ChatbotProps {
  onCommand: (response: BotResponse) => void;
  currentState: FarmState;
}

// Define the schema for the model's response to ensure structured commands
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: { 
      type: Type.STRING, 
      description: "Your conversational reply to the user. Be helpful, concise, and act as the AI assistant for the farming gantry." 
    },
    command: {
      type: Type.OBJECT,
      description: "Optional command to control the gantry based on user request. Only include if the user asked to perform an action.",
      properties: {
        action: { 
          type: Type.STRING, 
          description: "The action to perform. Must be one of: MOVE, SWAP_TOOL, WATER, SEED, SCAN, WEED, NONE" 
        },
        x: { type: Type.NUMBER, description: "X coordinate (0 to 10) for MOVE action." },
        y: { type: Type.NUMBER, description: "Y coordinate (0 to 10) for MOVE action." },
        z: { type: Type.NUMBER, description: "Z coordinate (0 to 10) for MOVE action. 0 is ground level, 10 is highest." },
        tool: { 
          type: Type.STRING, 
          description: "Tool name for SWAP_TOOL action. Must be one of: water_nozzle, seeder, camera, weeder, none" 
        }
      }
    }
  },
  required: ["reply"]
};

const systemInstruction = `
You are AgriTwin, the intelligent AI assistant controlling a 3D farming gantry system (similar to FarmBot).
Your job is to help the user monitor the farm and control the gantry.

The gantry operates on a 10x10 grid (X: 0-10, Y: 0-10). Z is height (0-10).
Available tools: 'water_nozzle', 'seeder', 'camera', 'weeder', 'none'.

When a user asks you to do something (e.g., "move to the center", "water the plant at 2,3", "change to the seeder"), you MUST output a JSON response that includes a 'command' object to execute that action, along with a friendly 'reply'.

If they just ask a question (e.g., "what is your status?"), just provide a 'reply' and omit the 'command' object, or set action to NONE.

Current Farm State Context (use this to inform your replies):
- You will be provided with the current state in the prompt if needed, but generally rely on the user's instructions.
`;

export const Chatbot: React.FC<ChatbotProps> = ({ onCommand, currentState }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello! I am AgriTwin, your gantry control assistant. How can I help you manage the farm today? Try asking me to "move to center" or "swap to the water nozzle".',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini Chat Session
  useEffect(() => {
    const initChat = async () => {
      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
          setError("API_KEY environment variable is missing.");
          return;
        }

        const ai = new GoogleGenAI({ apiKey, vertexai: true });
        chatSessionRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.2, // Low temperature for more deterministic commands
          }
        });
      } catch (err: any) {
        setError(`Failed to initialize AI: ${err.message}`);
      }
    };

    initChat();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userText = input.trim();
    setInput('');
    setError(null);

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // Inject current state context into the prompt invisibly to help the model
      const contextPrompt = `
[System Context: Current State - Pos(X:${currentState.position.x}, Y:${currentState.position.y}, Z:${currentState.position.z}), Tool:${currentState.activeTool}]
User Request: ${userText}
      `;

      const response = await chatSessionRef.current.sendMessage({ message: contextPrompt });
      
      if (response.text) {
        try {
          const parsedResponse = JSON.parse(response.text) as BotResponse;
          
          const newModelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: parsedResponse.reply,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, newModelMsg]);
          
          // Pass the command up to the parent to update the Digital Twin
          if (parsedResponse.command && parsedResponse.command.action !== 'NONE') {
            onCommand(parsedResponse);
          }

        } catch (parseError) {
          console.error("Failed to parse JSON response:", response.text);
          setError("Received invalid response format from AI.");
        }
      } else {
        setError("Received empty response from AI.");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(`Error communicating with AI: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-emerald-500/20 p-2 rounded-lg">
          <Bot className="text-emerald-400" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">AgriTwin Assistant</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Online
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-l-4 border-red-500 p-3 m-4 rounded flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl p-3 ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-sm' 
                : 'bg-slate-700 text-slate-100 rounded-tl-sm border border-slate-600'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                  {msg.role === 'user' ? 'You' : 'AgriTwin'}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-100 rounded-2xl rounded-tl-sm p-4 border border-slate-600 flex items-center gap-3">
              <Loader2 className="animate-spin text-emerald-400" size={18} />
              <span className="text-sm text-slate-300">Processing command...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Move to X:5 Y:5 and water the area..."
            className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none h-[52px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          Powered by Gemini 2.5 Flash. Commands are simulated in the Digital Twin.
        </p>
      </div>
    </div>
  );
};
