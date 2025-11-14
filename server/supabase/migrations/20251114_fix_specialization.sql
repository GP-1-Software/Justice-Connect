-- Fix malformed specialization entries stored like {"القانون الجنائي"}
-- This migration normalizes each array element by stripping wrapping {""} or extra quotes

UPDATE lawyers
SET specialization = (
  SELECT array_agg(
    CASE
      WHEN elem ~ '^\{\".+\"\}$' THEN regexp_replace(elem, '^\{\"(.+)\"\}$', '\1')
      WHEN elem ~ '^\".+\"$' THEN regexp_replace(elem, '^\"(.+)\"$', '\1')
      ELSE elem
    END
  )
  FROM unnest(specialization) AS elem
)
WHERE specialization IS NOT NULL;

-- Optional: remove empty strings
UPDATE lawyers
SET specialization = (
  SELECT array_agg(e) FROM unnest(specialization) AS e WHERE length(trim(e)) > 0
)
WHERE specialization IS NOT NULL;
