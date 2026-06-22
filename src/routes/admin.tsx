import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Upload, FileText, Pencil, X, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  adminVerify,
  adminMutate,
  adminUploadDocument,
  adminDeleteDocument,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NECN" }] }),
  component: AdminPage,
});

const PASSWORD_KEY = "necn_admin_pw";

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(PASSWORD_KEY);
    if (stored) setPassword(stored);
  }, []);

  if (!password) return <Login onLogin={(pw) => { sessionStorage.setItem(PASSWORD_KEY, pw); setPassword(pw); }} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Changes here update the website instantly.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { sessionStorage.removeItem(PASSWORD_KEY); setPassword(null); }}>
          <LogOut className="w-4 h-4 mr-1.5" />Logout
        </Button>
      </div>
      <Tabs defaultValue="faqs">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="hostel">Hostel</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="faqs"><FaqsPanel password={password} /></TabsContent>
        <TabsContent value="courses"><CoursesPanel password={password} /></TabsContent>
        <TabsContent value="hostel"><HostelPanel password={password} /></TabsContent>
        <TabsContent value="contact"><ContactPanel password={password} /></TabsContent>
        <TabsContent value="documents"><DocumentsPanel password={password} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (pw: string) => void }) {
  const verify = useServerFn(adminVerify);
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setLoading(true);
    try {
      await verify({ data: { password: pw } });
      onLogin(pw);
      toast.success("Welcome back");
    } catch {
      toast.error("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-soft">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Admin Login</h1>
        <p className="text-muted-foreground text-sm text-center mb-6">Enter password to access dashboard</p>
        <Label htmlFor="pw">Password</Label>
        <Input
          id="pw"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Enter admin password"
          className="mt-1.5 mb-4"
          autoFocus
        />
        <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90">
          {loading ? "Checking..." : "Login"}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">Demo password: admin123</p>
      </form>
    </div>
  );
}

function useTable<T extends { id: string }>(table: string) {
  const [rows, setRows] = useState<T[]>([]);
  const reload = async () => {
    const { data, error } = await (supabase.from(table as any) as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as T[]) ?? []);
  };
  useEffect(() => { reload(); }, []); // eslint-disable-line
  return { rows, reload };
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-card border border-border rounded-xl p-5">{children}</div>;
}

function useMutate(password: string, tableName: any, reload: () => void) {
  const mutate = useServerFn(adminMutate);
  return async (op: "insert" | "update" | "delete", payload?: any, id?: string) => {
    try {
      await mutate({ data: { password, table: tableName, op, payload, id } });
      toast.success("Saved");
      reload();
      return true;
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
      return false;
    }
  };
}

function FaqsPanel({ password }: { password: string }) {
  const { rows, reload } = useTable<any>("faqs");
  const run = useMutate(password, "faqs", reload);
  const empty = { category: "", question_en: "", answer_en: "", question_te: "", answer_te: "" };
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const save = async () => {
    if (!form.category || !form.question_en || !form.answer_en) { toast.error("Category, question & answer (EN) required"); return; }
    const { id, created_at, updated_at, ...payload } = form;
    const ok = await run(editId ? "update" : "insert", payload, editId ?? undefined);
    if (ok) { setForm(empty); setEditId(null); }
  };
  const del = async (id: string) => { if (confirm("Delete this FAQ?")) await run("delete", undefined, id); };

  return (
    <div className="grid md:grid-cols-2 gap-5 mt-5">
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">{editId ? <><Pencil className="w-4 h-4" />Edit FAQ</> : <><Plus className="w-4 h-4" />Add FAQ</>}</h3>
        <div className="space-y-3">
          <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Admissions, Fees, Hostel..." /></div>
          <div><Label>Question (English)</Label><Input value={form.question_en} onChange={(e) => setForm({ ...form, question_en: e.target.value })} /></div>
          <div><Label>Answer (English)</Label><Textarea value={form.answer_en} onChange={(e) => setForm({ ...form, answer_en: e.target.value })} rows={3} /></div>
          <div><Label>Question (Telugu, optional)</Label><Input value={form.question_te ?? ""} onChange={(e) => setForm({ ...form, question_te: e.target.value })} /></div>
          <div><Label>Answer (Telugu, optional)</Label><Textarea value={form.answer_te ?? ""} onChange={(e) => setForm({ ...form, answer_te: e.target.value })} rows={3} /></div>
          <div className="flex gap-2">
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">{editId ? "Update" : "Add"}</Button>
            {editId && <Button variant="outline" onClick={() => { setForm(empty); setEditId(null); }}><X className="w-4 h-4 mr-1" />Cancel</Button>}
          </div>
        </div>
      </Card>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs px-2 py-0.5 bg-accent rounded-md inline-block mb-1.5 font-medium">{r.category}</div>
                <div className="font-medium text-sm">{r.question_en}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.answer_en}</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setForm(r); setEditId(r.id); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CoursesPanel({ password }: { password: string }) {
  const { rows, reload } = useTable<any>("courses");
  const run = useMutate(password, "courses", reload);
  const empty = { name: "", code: "", duration: "", eligibility: "", fees: "", description: "", seats: 0 };
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const save = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    const { id, created_at, updated_at, ...rest } = form;
    const payload = { ...rest, seats: Number(rest.seats) || null };
    const ok = await run(editId ? "update" : "insert", payload, editId ?? undefined);
    if (ok) { setForm(empty); setEditId(null); }
  };
  const del = async (id: string) => { if (confirm("Delete this course?")) await run("delete", undefined, id); };

  return (
    <div className="grid md:grid-cols-2 gap-5 mt-5">
      <Card>
        <h3 className="font-semibold mb-3">{editId ? "Edit Course" : "Add Course"}</h3>
        <div className="space-y-3">
          {["name","code","duration","eligibility","fees","seats"].map((k) => (
            <div key={k}><Label className="capitalize">{k}</Label><Input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="flex gap-2">
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">{editId ? "Update" : "Add"}</Button>
            {editId && <Button variant="outline" onClick={() => { setForm(empty); setEditId(null); }}>Cancel</Button>}
          </div>
        </div>
      </Card>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{r.name} {r.code && <span className="text-xs text-muted-foreground">({r.code})</span>}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.duration} · {r.fees} · {r.seats} seats</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setForm(r); setEditId(r.id); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HostelPanel({ password }: { password: string }) {
  const { rows, reload } = useTable<any>("hostel_info");
  const run = useMutate(password, "hostel_info", reload);
  const empty = { title: "", description: "", fees: "", facilities: "" };
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const save = async () => {
    if (!form.title || !form.description) { toast.error("Title & description required"); return; }
    const { id, created_at, updated_at, ...payload } = form;
    const ok = await run(editId ? "update" : "insert", payload, editId ?? undefined);
    if (ok) { setForm(empty); setEditId(null); }
  };
  const del = async (id: string) => { if (confirm("Delete?")) await run("delete", undefined, id); };
  return (
    <div className="grid md:grid-cols-2 gap-5 mt-5">
      <Card>
        <h3 className="font-semibold mb-3">{editId ? "Edit" : "Add"} Hostel Info</h3>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div><Label>Fees</Label><Input value={form.fees ?? ""} onChange={(e) => setForm({ ...form, fees: e.target.value })} /></div>
          <div><Label>Facilities</Label><Textarea value={form.facilities ?? ""} onChange={(e) => setForm({ ...form, facilities: e.target.value })} rows={2} /></div>
          <div className="flex gap-2">
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">{editId ? "Update" : "Add"}</Button>
            {editId && <Button variant="outline" onClick={() => { setForm(empty); setEditId(null); }}>Cancel</Button>}
          </div>
        </div>
      </Card>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between gap-3">
              <div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground mt-1">{r.fees}</div></div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setForm(r); setEditId(r.id); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ContactPanel({ password }: { password: string }) {
  const { rows, reload } = useTable<any>("contact_info");
  const run = useMutate(password, "contact_info", reload);
  const empty = { label: "", value: "", type: "phone" };
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const save = async () => {
    if (!form.label || !form.value) { toast.error("Label & value required"); return; }
    const { id, created_at, updated_at, ...payload } = form;
    const ok = await run(editId ? "update" : "insert", payload, editId ?? undefined);
    if (ok) { setForm(empty); setEditId(null); }
  };
  const del = async (id: string) => { if (confirm("Delete?")) await run("delete", undefined, id); };
  return (
    <div className="grid md:grid-cols-2 gap-5 mt-5">
      <Card>
        <h3 className="font-semibold mb-3">{editId ? "Edit" : "Add"} Contact</h3>
        <div className="space-y-3">
          <div><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <div><Label>Value</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          <div><Label>Type</Label>
            <select value={form.type ?? ""} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-10 px-3 bg-input rounded-md border border-border">
              <option value="phone">Phone</option><option value="email">Email</option><option value="address">Address</option>
              <option value="website">Website</option><option value="hours">Hours</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">{editId ? "Update" : "Add"}</Button>
            {editId && <Button variant="outline" onClick={() => { setForm(empty); setEditId(null); }}>Cancel</Button>}
          </div>
        </div>
      </Card>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between gap-3">
              <div><div className="text-xs text-muted-foreground">{r.label}</div><div className="font-medium">{r.value}</div></div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setForm(r); setEditId(r.id); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DocumentsPanel({ password }: { password: string }) {
  const { rows, reload } = useTable<any>("documents");
  const uploadFn = useServerFn(adminUploadDocument);
  const deleteFn = useServerFn(adminDeleteDocument);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("brochure");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file || !title) { toast.error("File and title required"); return; }
    setUploading(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
      const fileBase64 = btoa(binary);
      await uploadFn({ data: {
        password, title, category, description,
        filename: file.name, fileBase64, contentType: file.type || "application/pdf",
      }});
      toast.success("Uploaded");
      setTitle(""); setDescription(""); setFile(null);
      reload();
    } catch (e: any) { toast.error(e?.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };
  const del = async (r: any) => {
    if (!confirm("Delete document?")) return;
    try { await deleteFn({ data: { password, id: r.id, path: r.file_path } }); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e?.message ?? "Delete failed"); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-5 mt-5">
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Upload className="w-4 h-4" />Upload Document</h3>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2025 Brochure" /></div>
          <div><Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 bg-input rounded-md border border-border">
              <option value="brochure">Brochure</option><option value="fees">Fee Structure</option>
              <option value="placement">Placement Report</option><option value="other">Other</option>
            </select>
          </div>
          <div><Label>Description (optional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div><Label>File (PDF)</Label><Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          <Button onClick={upload} disabled={uploading} className="bg-gradient-primary text-primary-foreground">
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </Card>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary shrink-0" /><div className="font-medium truncate">{r.title}</div></div>
                <div className="text-xs text-muted-foreground mt-1">{r.category} {r.description && `· ${r.description}`}</div>
                {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View file</a>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(r)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
