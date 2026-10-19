import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import logo from "@/assets/necn-logo.jpeg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const links = [
  { to: "/", label: "Home" },
  { to: "/chatbot", label: "Chatbot" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { location } = useRouterState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/85 border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="NECN" width={36} height={36} className="rounded-full" />
          <div className="leading-tight">
            <div className="font-bold text-base">NECN</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">AI Assistant</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === l.to ? "text-primary bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
              }`}
            >{l.label}</Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === "/admin" ? "text-primary bg-accent" : "text-foreground/70 hover:bg-accent/60"}`}>Admin</Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {session && (
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="w-4 h-4 mr-1.5" /> Sign out
            </Button>
          )}
          <Link to="/admin"><Button size="sm" variant="outline">Admin Login</Button></Link>
          <Link to="/chatbot"><Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-soft">Ask AI</Button></Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent">{l.label}</Link>
            ))}
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent">Admin</Link>}
            {session ? (
              <button onClick={() => { supabase.auth.signOut(); setOpen(false); }} className="px-3 py-2.5 text-left rounded-md text-sm font-medium hover:bg-accent">Sign out</button>
            ) : null}
            <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent">Admin Login</Link>
          </div>
        </div>
      )}
    </header>
  );
}
