-- ============================================================
-- NFI REPORT — Mise à jour admin
-- 1. Colonne promo_code dans payment_requests
-- 2. Colonne admin_note dans payment_requests
-- 3. Policy UPDATE pour payment_requests (admin via anon key)
-- ============================================================

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Permettre la mise à jour des demandes de paiement (vérification admin)
CREATE POLICY "payment_requests_update_all"
  ON public.payment_requests FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
