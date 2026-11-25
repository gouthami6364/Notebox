import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("DATABASE_WEBHOOK_SECRET");
  if (
    !webhookSecret ||
    request.headers.get("x-webhook-secret") !== webhookSecret
  ) {
    return json({ error: "Unauthorized" }, 401);
  }

  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@notebox.app";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!publicKey || !privateKey || !supabaseUrl || !serviceRoleKey) {
    return json({ error: "Push function secrets are not configured" }, 500);
  }

  let event: {
    type?: string;
    table?: string;
    record?: Record<string, unknown>;
  };

  try {
    event = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const record = event.record;

  if (event.type !== "INSERT" || event.table !== "documents" || !record?.id) {
    return json({ skipped: true, reason: "Not a new document event" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth");

  if (error) {
    return json({ error: "Could not load subscriptions" }, 500);
  }

  if (!subscriptions?.length) {
    return json({ sent: 0, expired: 0 });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const sectionNames: Record<string, string> = {
    notes: "Notes",
    homework: "Today's homework",
    assignment: "Assignments",
    internal: "Internal papers",
    external: "External papers",
  };

  const subjectCode = String(record.subject_code || "");
  const section = String(record.section || "");
  const title = String(record.title || "New document");

  const payload = JSON.stringify({
    title: "New Notebox upload",
    body: `${title} · ${subjectCode} · ${sectionNames[section] || section}`,
    url: `/#/subject/${encodeURIComponent(subjectCode)}/${encodeURIComponent(section)}`,
    tag: `document-${record.id}`,
  });

  let sent = 0;
  let expired = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;

        if (statusCode === 404 || statusCode === 410) {
          expired += 1;
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);
        } else {
          console.error("Push delivery failed:", statusCode || "unknown");
        }
      }
    }),
  );

  return json({ sent, expired });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}