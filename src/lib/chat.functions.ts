import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
  language: z.enum(["en", "te"]).optional().default("en"),
  conversationId: z.string().uuid().nullable().optional(),
  sessionId: z.string().min(8).max(64),
});

export const askChatbot = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load knowledge base
    const [faqs, courses, hostel, contact, docs] = await Promise.all([
      supabaseAdmin.from("faqs").select("category,question_en,answer_en,question_te,answer_te"),
      supabaseAdmin.from("courses").select("name,code,duration,eligibility,fees,description,seats"),
      supabaseAdmin.from("hostel_info").select("title,description,fees,facilities"),
      supabaseAdmin.from("contact_info").select("label,value,type"),
      supabaseAdmin.from("documents").select("title,category,description"),
    ]);

    const kb = JSON.stringify({
      faqs: faqs.data ?? [],
      courses: courses.data ?? [],
      hostel: hostel.data ?? [],
      contact: contact.data ?? [],
      uploaded_documents: docs.data ?? [],
    });

    const langInstr =
      data.language === "te"
        ? "Respond in Telugu (తెలుగు). If the user writes in English, you may also respond in English."
        : "Respond in the same language the user writes in. Default to English. Support Telugu (తెలుగు) if asked.";

    const systemPrompt = `You are "NECN AI Assistant", the official AI enquiry assistant for NECN College.
You answer questions about admissions, courses, fees, hostel, placements, transport, scholarships, library, laboratories and contact details.

Rules:
- Only answer questions about NECN College or general academic/career guidance related to it.
- If a question is unrelated (politics, jokes, weather, coding help, etc.), politely decline and steer back to college topics.
- If specific information is NOT in the knowledge base below, say so honestly and suggest contacting the admissions office.
- Be concise, warm, and helpful. Use bullet points or short paragraphs.
- ${langInstr}

KNOWLEDGE BASE (authoritative source):
${kb}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemini-2.5-flash", messages }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
      if (res.status === 402) throw new Error("AI service credits exhausted. Please contact the administrator.");
      const t = await res.text();
      console.error("AI error", res.status, t);
      throw new Error("AI service is currently unavailable.");
    }

    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    // Persist conversation
    try {
      let convId = data.conversationId ?? null;
      if (!convId) {
        const { data: conv } = await supabaseAdmin
          .from("chat_conversations")
          .insert({ session_id: data.sessionId, title: data.messages[0].content.slice(0, 80) })
          .select("id")
          .single();
        convId = conv?.id ?? null;
      }
      if (convId) {
        const lastUser = data.messages[data.messages.length - 1];
        await supabaseAdmin.from("chat_messages").insert([
          { conversation_id: convId, role: "user", content: lastUser.content },
          { conversation_id: convId, role: "assistant", content: reply },
        ]);
      }
      return { reply, conversationId: convId };
    } catch (e) {
      console.error("persist error", e);
      return { reply, conversationId: data.conversationId ?? null };
    }
  });
