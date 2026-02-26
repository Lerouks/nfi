/**
 * NFI REPORT — Emails transactionnels via Resend
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UNE EDGE FUNCTION ?
 * La clé Resend (re_...) ne doit JAMAIS apparaître dans le code frontend —
 * elle serait visible dans les DevTools et pourrait être volée.
 * La solution : une Supabase Edge Function qui reçoit l'email en paramètre
 * et appelle Resend côté serveur (Node.js).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DÉPLOYER L'EDGE FUNCTION (une seule fois) :
 *
 * 1. Dans ton dashboard Supabase → Edge Functions → New Function
 *    Nom : send-welcome-email
 *
 * 2. Code de la fonction (Deno) :
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
 *
 *   serve(async (req) => {
 *     const { email } = await req.json();
 *     const res = await fetch("https://api.resend.com/emails", {
 *       method: "POST",
 *       headers: {
 *         "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
 *         "Content-Type": "application/json",
 *       },
 *       body: JSON.stringify({
 *         from: "NFI REPORT <noreply@nfireport.com>",
 *         to: [email],
 *         subject: "Bienvenue sur NFI REPORT 🎉",
 *         html: `
 *           <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
 *             <div style="background:#0D1B35;padding:24px;border-radius:12px 12px 0 0">
 *               <h1 style="color:#00A651;margin:0">NFI REPORT</h1>
 *               <p style="color:#9ca3af;font-size:12px;margin:4px 0 0">Niger Financial Insights</p>
 *             </div>
 *             <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
 *               <h2 style="color:#111827">Bienvenue dans la communauté NFI REPORT !</h2>
 *               <p style="color:#374151">
 *                 Vous recevrez chaque matin nos analyses économiques et financières
 *                 sur l'Afrique et le Niger directement dans votre boîte mail.
 *               </p>
 *               <a href="https://nfireport.com"
 *                  style="display:inline-block;background:#00A651;color:#fff;
 *                         padding:12px 28px;border-radius:9999px;text-decoration:none;
 *                         font-weight:600;margin-top:16px">
 *                 Lire les dernières analyses →
 *               </a>
 *               <p style="color:#9ca3af;font-size:12px;margin-top:24px">
 *                 Pour vous désabonner, répondez à cet email avec "STOP".
 *               </p>
 *             </div>
 *           </div>
 *         `,
 *       }),
 *     });
 *     const data = await res.json();
 *     return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
 *   });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. Dans Supabase → Edge Functions → send-welcome-email → Secrets :
 *    Ajouter : RESEND_API_KEY = re_PWxzYpWS_6GqYosQVPZ8r9nNFHt2NsF7D
 *
 * 4. Copier l'URL de l'Edge Function et la mettre dans .env :
 *    VITE_EDGE_EMAIL_URL=https://xxxx.supabase.co/functions/v1/send-welcome-email
 * ─────────────────────────────────────────────────────────────────────────────
 */

const EDGE_EMAIL_URL = import.meta.env.VITE_EDGE_EMAIL_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * Envoie l'email de bienvenue via la Supabase Edge Function.
 * Ne fait rien si l'URL n'est pas configurée (fail gracieux).
 */
export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!EDGE_EMAIL_URL) {
    console.info(
      "[Resend] Email de bienvenue non envoyé — configurez VITE_EDGE_EMAIL_URL dans .env\n" +
      "  Voir les instructions dans /src/lib/email.ts"
    );
    return;
  }
  try {
    const res = await fetch(EDGE_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Resend] Échec envoi email :", err);
    } else {
      console.info("[Resend] Email de bienvenue envoyé à :", email);
    }
  } catch (err) {
    console.error("[Resend] Erreur réseau :", err);
  }
}
