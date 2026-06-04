import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Globe, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NECN College" },
      { name: "description", content: "Get in touch with NECN College admissions, office and faculty." },
    ],
  }),
  component: Contact,
});

const iconMap: Record<string, any> = {
  address: MapPin, phone: Phone, email: Mail, website: Globe, hours: Clock,
};

function Contact() {
  const q = useQuery({
    queryKey: ["contact"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_info").select("*");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="bg-gradient-hero text-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Contact Us</h1>
          <p className="text-white/85">We'd love to hear from you.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 gap-4">
          {q.data?.map((c) => {
            const Icon = iconMap[c.type ?? ""] ?? MapPin;
            return (
              <div key={c.id} className="bg-card border border-border rounded-xl p-5 flex gap-4 hover:shadow-soft transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">{c.label}</div>
                  <div className="font-medium text-sm">{c.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
