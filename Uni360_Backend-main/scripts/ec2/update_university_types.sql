-- ============================================================
-- University type + institution_type bulk update
-- Run on EC2 via: bash scripts/ec2/run_uni_types.sh
-- ============================================================

-- 1. PUBLIC + RESEARCH (Classical German state research universities + Oxford)
UPDATE universities
SET data = data
  || '{"type": "public", "institution_type": "research", "status": "ACTIVE", "tags": ["research-intensive", "state-funded"]}'::jsonb
WHERE name IN (
  'Albert-Ludwigs-Universität Freiburg',
  'Freie Universität Berlin',
  'Humboldt-Universität zu Berlin',
  'Johannes Gutenberg-Universität Mainz',
  'Ludwig Maximilian University of Munich',
  'Universität Heidelberg',
  'Universität Hamburg',
  'Universität Stuttgart',
  'Universität Mannheim',
  'Universität Leipzig',
  'Universität Münster',
  'Universität Potsdam',
  'Universität Regensburg',
  'Universität Trier',
  'Universität Ulm',
  'University of Oxford'
);

-- 2. PUBLIC + TECHNICAL (Engineering-focused TUs)
UPDATE universities
SET data = data
  || '{"type": "public", "institution_type": "technical", "status": "ACTIVE", "tags": ["engineering", "technical", "state-funded"]}'::jsonb
WHERE name IN (
  'RWTH Aachen University',
  'Technical University of Munich',
  'Technische Universität Berlin',
  'Technische Universität Dresden',
  'Technische Universität Darmstadt',
  'Technische Universität Dortmund',
  'Technische Universität Hamburg',
  'Technische Universität Braunschweig',
  'Technische Universität Chemnitz',
  'Karlsruher Institut für Technologie'
);

-- 3. PUBLIC + APPLIED SCIENCES (Hochschule / FH)
UPDATE universities
SET data = data
  || '{"type": "public", "institution_type": "applied_sciences", "status": "ACTIVE", "tags": ["applied-sciences", "state-funded"]}'::jsonb
WHERE name IN (
  'FH Aachen',
  'Frankfurt University of Applied Sciences',
  'Hochschule Darmstadt',
  'Hochschule Fulda',
  'Hochschule Trier',
  'Technische Hochschule Rosenheim',
  'accadis Hochschule Bad Homburg'
);

-- 4. PRIVATE + APPLIED SCIENCES
UPDATE universities
SET data = data
  || '{"type": "private", "institution_type": "applied_sciences", "status": "ACTIVE", "tags": ["applied-sciences", "private"]}'::jsonb
WHERE name IN (
  'Fresenius University of Applied Sciences',
  'SRH University',
  'Constructor University',
  'Berlin International University of Applied Sciences'
);

-- 5. PRIVATE + BUSINESS SCHOOLS
UPDATE universities
SET data = data
  || '{"type": "private", "institution_type": "business", "status": "ACTIVE", "tags": ["business", "mba", "finance", "management"]}'::jsonb
WHERE name IN (
  'Frankfurt School of Finance & Management',
  'WHU - Otto Beisheim School of Management',
  'HHL Leipzig Graduate School of Management',
  'Hertie School'
);

-- 6. PUBLIC + MEDICAL
UPDATE universities
SET data = data
  || '{"type": "public", "institution_type": "medical", "status": "ACTIVE", "tags": ["medical", "state-funded"]}'::jsonb
WHERE name IN (
  'Charité - Universitätsmedizin Berlin'
);

-- 7. PUBLIC + ARTS / MEDIA
UPDATE universities
SET data = data
  || '{"type": "public", "institution_type": "arts", "status": "ACTIVE", "tags": ["arts", "media", "state-funded"]}'::jsonb
WHERE name IN (
  'Folkwang University of the Arts',
  'Merz Akademie',
  'ifs Internationale Filmschule Köln',
  'Hochschule für Musik Detmold'
);

-- 8. SEMI-PRIVATE + RELIGIOUS
UPDATE universities
SET data = data
  || '{"type": "semi_private", "institution_type": "religious", "status": "ACTIVE", "tags": ["religious", "faith-based"]}'::jsonb
WHERE name IN (
  'Katholische Universität Eichstätt-Ingolstadt',
  'Theologische Hochschule Friedensau'
);

-- ============================================================
-- Verify: Show all universities with their updated type/institution_type
-- ============================================================
SELECT
  name,
  data->>'country_code'    AS cc,
  data->>'type'            AS type,
  data->>'institution_type' AS institution_type,
  data->>'status'          AS status
FROM universities
ORDER BY data->>'type', data->>'institution_type', name;
