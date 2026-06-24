import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_TABLES = ["faqs", "courses", "hostel_info", "contact_info", "documents"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

// 1 hour signed URL TTL — short-lived, refresh on demand from the admin UI.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const adminVerify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return { ok: true };
  });

export const adminMutate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      table: AllowedTable;
      op: "insert" | "update" | "delete";
      payload?: Record<string, any>;
      id?: string;
    }) => d
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!ALLOWED_TABLES.includes(data.table)) throw new Error("Invalid table");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tbl = supabaseAdmin.from(data.table as any);
    if (data.op === "insert") {
      const { data: row, error } = await tbl.insert(data.payload as any).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    if (data.op === "update") {
      if (!data.id) throw new Error("id required");
      const { data: row, error } = await tbl.update(data.payload as any).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    if (data.op === "delete") {
      if (!data.id) throw new Error("id required");
      const { error } = await tbl.delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    throw new Error("Invalid op");
  });

export const adminUploadDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      title: string;
      category: string;
      description?: string;
      filename: string;
      fileBase64: string;
      contentType?: string;
    }) => d
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const contentType = (data.contentType || "application/pdf").toLowerCase();
    if (!ALLOWED_UPLOAD_TYPES.has(contentType)) {
      throw new Error(
        `Unsupported file type: ${contentType}. Allowed: ${[...ALLOWED_UPLOAD_TYPES].join(", ")}`
      );
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safeName = data.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${data.category}/${Date.now()}-${safeName}`;
    const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
    const { error: upErr } = await supabaseAdmin.storage
      .from("documents")
      .upload(path, bytes, { contentType });
    if (upErr) throw new Error(upErr.message);
    const { data: signed } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    const { data: row, error } = await supabaseAdmin
      .from("documents")
      .insert({
        title: data.title,
        category: data.category,
        description: data.description ?? null,
        file_path: path,
        file_url: signed?.signedUrl ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; path: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.path) await supabaseAdmin.storage.from("documents").remove([data.path]);
    const { error } = await supabaseAdmin.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
