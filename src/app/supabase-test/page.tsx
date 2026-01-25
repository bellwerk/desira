export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";

export default async function SupabaseTestPage() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getSession();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Supabase test</h1>
      <p>
        If you see this page, Next.js can import Supabase client. Session is{" "}
        <b>{data?.session ? "present" : "empty"}</b>.
      </p>

      {error ? (
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}
