import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/necn-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin Login — NECN" }, { name: "description", content: "Admin login for NECN College dashboard." }] }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/admin" }); });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin", data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Account created! You can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/admin" });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 bg-gradient-soft">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-soft p-8">
        <div className="text-center mb-6">
          <img src={logo} alt="NECN" width={56} height={56} className="rounded-full mx-auto mb-3" />
          <h1 className="text-2xl font-bold">{mode === "signin" ? "Admin Login" : "Create Admin Account"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "First account becomes the admin." : "Sign in to manage the chatbot."}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>
        <div className="text-center mt-5 text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>No account? <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
