import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Award, Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About NECN College — NECN AI Assistant" },
      { name: "description", content: "Learn about NECN College's programs, hostel and campus facilities." },
    ],
  }),
  component: About,
});

function About() {
  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const hostel = useQuery({
    queryKey: ["hostel"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hostel_info").select("*");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="bg-gradient-hero text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">About NECN College</h1>
          <p className="text-white/85 max-w-2xl mx-auto">
            A leading institution offering quality engineering and management education, with a focus on industry-ready learning and holistic student growth.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: GraduationCap, k: "5000+", v: "Students" },
          { icon: Award, k: "85%", v: "Placement Rate" },
          { icon: Users, k: "200+", v: "Faculty" },
          { icon: Building2, k: "50+", v: "Acres Campus" },
        ].map((s) => (
          <div key={s.v} className="bg-card border border-border rounded-xl p-6 text-center">
            <s.icon className="w-7 h-7 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold">{s.k}</div>
            <div className="text-sm text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Courses Offered</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {courses.data?.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-soft transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{c.name}</h3>
                {c.code && <span className="text-xs px-2 py-0.5 bg-accent rounded-md font-medium">{c.code}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{c.duration}</span></div>
                <div><span className="text-muted-foreground">Seats:</span> <span className="font-medium">{c.seats}</span></div>
                <div><span className="text-muted-foreground">Eligibility:</span> <span className="font-medium">{c.eligibility}</span></div>
                <div><span className="text-muted-foreground">Fees:</span> <span className="font-medium text-primary">{c.fees}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Hostel & Facilities</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {hostel.data?.map((h) => (
            <div key={h.id} className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">{h.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{h.description}</p>
              <div className="text-sm space-y-1.5">
                <div><span className="text-muted-foreground">Fees:</span> <span className="font-medium text-primary">{h.fees}</span></div>
                <div><span className="text-muted-foreground">Facilities:</span> <span>{h.facilities}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
