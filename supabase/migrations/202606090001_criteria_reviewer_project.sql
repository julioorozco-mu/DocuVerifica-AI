-- Migración: Añadir campos reviewer_id y project_type a review_criteria
-- Estos campos permiten asociar criterios a revisores específicos y agruparlos por tipo de proyecto.

ALTER TABLE review_criteria
ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE review_criteria
ADD COLUMN IF NOT EXISTS project_type VARCHAR(100) DEFAULT NULL;

-- Índice para consultas frecuentes por revisor
CREATE INDEX IF NOT EXISTS idx_review_criteria_reviewer_id ON review_criteria(reviewer_id);
