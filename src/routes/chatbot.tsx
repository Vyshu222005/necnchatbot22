import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askChatbot } from "@/lib/chat.functions";
import { toast } from "sonner";
import logo from "@/assets/necn-logo.png";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "Chatbot — NECN AI Assistant" },
      { name: "description", content: "Chat with the NECN AI Assistant in English or Telugu." },
    ],
  }),
  component: Chatbot,
});

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "How do I apply for admission?",
  "What's the fee for B.Tech CSE?",
  "Tell me about hostel facilities",
  "Placement statistics",
];

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function Chatbot() {
  const ask = useServerFn(askChatbot);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hello! 👋 I'm the NECN AI Assistant. Ask me anything about admissions, courses, fees, hostel, placements and more. You can chat in English or Telugu (తెలుగు)." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [convId, setConvId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return uid();
    const k = "necn_session_id";
    let v = localStorage.getItem(k);
    if (!v) { v = uid(); localStorage.setItem(k, v); }
    return v;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const speak = (text: string) => {
    if (!voiceOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === "te" ? "te-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next.slice(-20), language, conversationId: convId, sessionId } });
      setConvId(res.conversationId);
      setMessages([...next, { role: "assistant", content: res.reply }]);
      speak(res.reply);
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
      setMessages([...next, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }
    if (listening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = language === "te" ? "te-IN" : "en-IN";
    r.interimResults = false;
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-soft">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" width={40} height={40} className="rounded-full" />
            <div>
              <div className="font-semibold flex items-center gap-1.5">NECN AI Assistant <Sparkles className="w-3.5 h-3.5 text-primary" /></div>
              <div className="text-xs text-muted-foreground">Online · Powered by AI</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={language} onChange={(e) => setLanguage(e.target.value as "en" | "te")}
              className="text-xs bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>
            <Button size="icon" variant="ghost" onClick={() => setVoiceOn((v) => !v)} title="Voice output">
              {voiceOn ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-accent text-accent-foreground" : "bg-gradient-primary text-primary-foreground"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary text-secondary-foreground rounded-tl-sm"
              }`}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center"><Bot className="w-4 h-4 text-primary-foreground" /></div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full" />
              </div>
            </div>
          )}
          {messages.length === 1 && (
            <div className="pt-3">
              <div className="text-xs text-muted-foreground mb-2">Try asking:</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-accent border border-border transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-3 py-3 bg-background">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
            <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={toggleVoice} title="Voice input">
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={language === "te" ? "మీ ప్రశ్న టైప్ చేయండి..." : "Type your question..."}
              rows={1}
              className="flex-1 resize-none bg-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="bg-gradient-primary text-primary-foreground">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
