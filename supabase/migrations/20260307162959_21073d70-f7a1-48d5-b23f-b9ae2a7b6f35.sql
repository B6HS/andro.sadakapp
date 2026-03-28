-- Fix: Make the donations insert policy more specific (require amount > 0)
DROP POLICY "Anyone can insert donations" ON public.donations;
CREATE POLICY "Anyone can insert donations with valid data"
  ON public.donations FOR INSERT
  WITH CHECK (amount > 0 AND cause IS NOT NULL AND reference IS NOT NULL);