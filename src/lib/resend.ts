/**
 * NFI REPORT — Configuration Resend (Emails transactionnels)
 *
 * IMPORTANT : Resend est une librairie SERVEUR. Elle ne doit jamais
 * être utilisée directement côté client (exposerait votre clé API).
 *
 * Usage correct : dans une fonction serverless / API route (ex: /api/send-email)
 *
 * Dashboard : https://resend.com/api-keys
 * Variable d'environnement (serveur uniquement, pas VITE_*) :
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *
 * ─── Exemple d'utilisation dans une API route ────────────────────────────────
 *
 *   // /api/send-email.ts (serverless function)
 *   import { Resend } from "resend";
 *
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *
 *   export async function POST(request: Request) {
 *     const { to, subject, html } = await request.json();
 *     const { data, error } = await resend.emails.send({
 *       from: "NFI REPORT <noreply@nfireport.com>",
 *       to,
 *       subject,
 *       html,
 *     });
 *     if (error) return Response.json({ error }, { status: 400 });
 *     return Response.json({ data });
 *   }
 *
 * ─── Templates d'emails NFI REPORT ──────────────────────────────────────────
 *
 * - Bienvenue après inscription
 * - Confirmation d'abonnement (Standard / Premium)
 * - Newsletter quotidienne
 * - Réinitialisation de mot de passe
 * - Facture mensuelle
 * - Alertes articles premium
 */

export const RESEND_FROM_EMAIL = "NFI REPORT <noreply@nfireport.com>";

export const EMAIL_SUBJECTS = {
  welcome: "Bienvenue sur NFI REPORT",
  subscriptionConfirm: "Votre abonnement NFI REPORT est activé",
  newsletter: "La lettre financière NFI REPORT",
  passwordReset: "Réinitialisation de votre mot de passe",
  invoice: "Votre facture NFI REPORT",
} as const;
