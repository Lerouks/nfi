import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NFI REPORT <noreply@nfireport.com>",
        to: [email],
        subject: "Bienvenue sur NFI REPORT 🎉",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0D1B35;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:#00A651;margin:0">NFI REPORT</h1>
              <p style="color:#9ca3af;font-size:12px;margin:4px 0 0">Niger Financial Insights</p>
            </div>
            <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
              <h2 style="color:#111827">Bienvenue dans la communauté NFI REPORT !</h2>
              <p style="color:#374151">
                Vous recevrez chaque matin nos analyses économiques et financières
                sur l'Afrique et le Niger directement dans votre boîte mail.
              </p>
              <a href="https://nfireport.com"
                 style="display:inline-block;background:#00A651;color:#fff;
                        padding:12px 28px;border-radius:9999px;text-decoration:none;
                        font-weight:600;margin-top:16px">
                Lire les dernières analyses →
              </a>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px">
                Pour vous désabonner, répondez à cet email avec "STOP".
              </p>
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge Function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
