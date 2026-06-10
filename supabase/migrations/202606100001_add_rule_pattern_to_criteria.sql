-- Añadir columna rule_pattern a la tabla review_criteria
ALTER TABLE public.review_criteria
ADD COLUMN IF NOT EXISTS rule_pattern VARCHAR(500) NULL;
