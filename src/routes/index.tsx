import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, BookOpen, Users, Award, Building2, Bus, Sparkles, ArrowRight } from "lucide-react";
import logo from "@/assets/necn-logo.png";
import hero from "@/assets/campus-hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NECN AI Assistant — Your College Enquiry Companion" },
      { name: "description", content: "Get instant answers about NECN College admissions, courses, fees, hostel and placements in English or Telugu." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: BookOpen, title: "Admissions & Courses", desc: "Detailed info on every B.Tech and MBA program." },
  { icon: Award, title: "Placements", desc: "85% placement rate. Top recruiters every year." },
  { icon: Building2, title: "Hostel & Campus", desc: "Modern facilities for boys and girls." },
  { icon: Bus, title: "Transport", desc: "30+ bus routes across the city." },
  { icon: Users, title: "Scholarships", desc: "Merit, sports & need-based scholarships." },
  { icon: Sparkles, title: "English & Telugu", desc: "Ask naturally in your preferred language." },
];

function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 opacity-20">
          <img src={hero} alt="" className="w-full h-full object-cover" width={1536} height={1024} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium mb-6 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> Powered by AI · 24/7 Available
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-5">
              Your AI guide to <br /><span className="text-white/95">NECN College</span>
            </h1>
            <p className="text-lg text-white/85 mb-8 max-w-xl">
              Get instant answers about admissions, courses, fees, hostel, placements & more — in English or Telugu, anytime.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/chatbot"><Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow">
                <MessageCircle className="w-4 h-4 mr-2" /> Start Chatting <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button></Link>
              <Link to="/about"><Button size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10">
                Learn more
              </Button></Link>
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="absolute -inset-8 bg-white/10 rounded-full blur-3xl" />
              <img src={logo} alt="NECN College Logo" width={320} height={320} className="relative w-72 h-72 rounded-full bg-white/10 backdrop-blur p-6 border border-white/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Everything you need to know</h2>
          <p className="text-muted-foreground">Ask the assistant anything — it knows our campus inside and out.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6 hover:shadow-soft transition-shadow">
              <div className="w-11 h-11 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-gradient-primary rounded-2xl p-10 sm:p-14 text-center text-primary-foreground shadow-glow">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Got questions? Ask the assistant.</h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto">Available in English & Telugu, with voice input and output support.</p>
          <Link to="/chatbot"><Button size="lg" className="bg-white text-primary hover:bg-white/90">
            <MessageCircle className="w-4 h-4 mr-2" /> Open Chatbot
          </Button></Link>
        </div>
      </section>
    </div>
  );
}
