-- V6: Workflow Stage Updates
-- Germany: Add FEES_PAYMENT stage (with BLOCK_ACCOUNT + TUITION_FEES_PAYMENT tasks) before UNIVERSITY_SUBMISSION
-- UK:      Add UNIVERSITY_SUBMISSION stage before VISA_APPLICATION

-- ============================================================
-- GERMANY MASTERS WORKFLOW
-- ============================================================
UPDATE workflow_definitions
SET workflow_config = jsonb_set(
    workflow_config,
    '{stages}',
    (
        SELECT jsonb_agg(stage ORDER BY (stage->>'order')::int)
        FROM (
            -- Keep all stages before UNIVERSITY_SUBMISSION (order 1-3)
            SELECT stage FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int < 4

            UNION ALL

            -- Insert new FEES_PAYMENT stage at order 4
            SELECT '{
                "name": "FEES_PAYMENT",
                "order": 4,
                "displayName": "Fees Payment",
                "description": "Student fees payment process before university submission",
                "tasks": [
                    {
                        "type": "BLOCK_ACCOUNT",
                        "priority": 1,
                        "ownerTypes": ["FINANCE_ADMIN", "COUNTRY_ADMIN"],
                        "description": "Verify student has opened and funded a blocked bank account (Sperrkonto) as required for German student visa",
                        "displayName": "Block Account Verification",
                        "requiredFlags": ["block_account_opened", "block_account_funded"],
                        "validationRule": "ADMIN_CONFIRMATION",
                        "estimatedDurationHours": 2
                    },
                    {
                        "type": "TUITION_FEES_PAYMENT",
                        "priority": 2,
                        "ownerTypes": ["FINANCE_ADMIN", "COUNTRY_ADMIN"],
                        "description": "Verify student has paid tuition fees to the university",
                        "displayName": "Tuition Fees Payment Verification",
                        "requiredFlags": ["fees_payment_initiated", "fees_payment_completed", "payment_receipt_uploaded"],
                        "validationRule": "ADMIN_CONFIRMATION",
                        "requiredDocuments": ["PAYMENT_RECEIPT", "PAYMENT_CONFIRMATION"],
                        "estimatedDurationHours": 2
                    }
                ]
            }'::jsonb AS stage

            UNION ALL

            -- Keep UNIVERSITY_SUBMISSION and later stages, bump their order by 1
            SELECT jsonb_set(stage, '{order}', to_jsonb((stage->>'order')::int + 1))
            FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int >= 4
        ) subq
    )
),
updated_at = NOW()
WHERE definition_key LIKE '%DE%MASTERS%'
  AND is_active = true
  AND deleted = false;


-- ============================================================
-- GERMANY BACHELORS WORKFLOW
-- ============================================================
UPDATE workflow_definitions
SET workflow_config = jsonb_set(
    workflow_config,
    '{stages}',
    (
        SELECT jsonb_agg(stage ORDER BY (stage->>'order')::int)
        FROM (
            SELECT stage FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int < 4

            UNION ALL

            SELECT '{
                "name": "FEES_PAYMENT",
                "order": 4,
                "displayName": "Fees Payment",
                "description": "Student fees payment process before university submission",
                "tasks": [
                    {
                        "type": "BLOCK_ACCOUNT",
                        "priority": 1,
                        "ownerTypes": ["FINANCE_ADMIN", "COUNTRY_ADMIN"],
                        "description": "Verify student has opened and funded a blocked bank account (Sperrkonto) as required for German student visa",
                        "displayName": "Block Account Verification",
                        "requiredFlags": ["block_account_opened", "block_account_funded"],
                        "validationRule": "ADMIN_CONFIRMATION",
                        "estimatedDurationHours": 2
                    },
                    {
                        "type": "TUITION_FEES_PAYMENT",
                        "priority": 2,
                        "ownerTypes": ["FINANCE_ADMIN", "COUNTRY_ADMIN"],
                        "description": "Verify student has paid tuition fees to the university",
                        "displayName": "Tuition Fees Payment Verification",
                        "requiredFlags": ["fees_payment_initiated", "fees_payment_completed", "payment_receipt_uploaded"],
                        "validationRule": "ADMIN_CONFIRMATION",
                        "requiredDocuments": ["PAYMENT_RECEIPT", "PAYMENT_CONFIRMATION"],
                        "estimatedDurationHours": 2
                    }
                ]
            }'::jsonb AS stage

            UNION ALL

            SELECT jsonb_set(stage, '{order}', to_jsonb((stage->>'order')::int + 1))
            FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int >= 4
        ) subq
    )
),
updated_at = NOW()
WHERE definition_key LIKE '%DE%BACHELOR%'
  AND is_active = true
  AND deleted = false;


-- ============================================================
-- UK MASTERS WORKFLOW
-- Add UNIVERSITY_SUBMISSION stage before VISA_APPLICATION
-- Current UK order: ...UNCONDITIONAL_OFFER (6), VISA_APPLICATION (7)
-- New order:        ...UNCONDITIONAL_OFFER (6), UNIVERSITY_SUBMISSION (7), VISA_APPLICATION (8)
-- ============================================================
UPDATE workflow_definitions
SET workflow_config = jsonb_set(
    workflow_config,
    '{stages}',
    (
        SELECT jsonb_agg(stage ORDER BY (stage->>'order')::int)
        FROM (
            -- Keep all stages up to and including UNCONDITIONAL_OFFER (order 1-6)
            SELECT stage FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int < 7

            UNION ALL

            -- Insert new UNIVERSITY_SUBMISSION stage at order 7
            SELECT '{
                "name": "UNIVERSITY_SUBMISSION",
                "order": 7,
                "displayName": "University Submission",
                "description": "Submit complete application package to the UK university",
                "tasks": [
                    {
                        "type": "UNIVERSITY_SUBMISSION",
                        "priority": 1,
                        "ownerTypes": ["COUNTRY_ADMIN", "UNIVERSITY_LIAISON"],
                        "description": "Submit complete application to selected UK universities",
                        "displayName": "Submit to Universities",
                        "requiredFlags": ["all_documents_verified", "fees_payment_completed", "universities_selected"],
                        "validationRule": "ADMIN_CONFIRMATION",
                        "requiredPermissions": ["UNIVERSITY_SUBMISSION"],
                        "estimatedDurationHours": 2
                    }
                ]
            }'::jsonb AS stage

            UNION ALL

            -- Bump VISA_APPLICATION (order 7 -> 8)
            SELECT jsonb_set(stage, '{order}', to_jsonb((stage->>'order')::int + 1))
            FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int >= 7
        ) subq
    )
),
updated_at = NOW()
WHERE definition_key LIKE '%UK%MASTERS%'
  AND is_active = true
  AND deleted = false;


-- ============================================================
-- UK BACHELORS WORKFLOW
-- ============================================================
UPDATE workflow_definitions
SET workflow_config = jsonb_set(
    workflow_config,
    '{stages}',
    (
        SELECT jsonb_agg(stage ORDER BY (stage->>'order')::int)
        FROM (
            SELECT stage FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int < 7

            UNION ALL

            SELECT '{
                "name": "UNIVERSITY_SUBMISSION",
                "order": 7,
                "displayName": "University Submission",
                "description": "Submit complete application package to the UK university",
                "tasks": [
                    {
                        "type": "UNIVERSITY_SUBMISSION",
                        "priority": 1,
                        "ownerTypes": ["COUNTRY_ADMIN", "UNIVERSITY_LIAISON"],
                        "description": "Submit complete application to selected UK universities",
                        "displayName": "Submit to Universities",
                        "requiredFlags": ["all_documents_verified", "fees_payment_completed", "universities_selected"],
                        "validationRule": "ADMIN_CONFIRMATION",
                        "requiredPermissions": ["UNIVERSITY_SUBMISSION"],
                        "estimatedDurationHours": 2
                    }
                ]
            }'::jsonb AS stage

            UNION ALL

            SELECT jsonb_set(stage, '{order}', to_jsonb((stage->>'order')::int + 1))
            FROM jsonb_array_elements(workflow_config->'stages') AS stage
            WHERE (stage->>'order')::int >= 7
        ) subq
    )
),
updated_at = NOW()
WHERE definition_key LIKE '%UK%BACHELOR%'
  AND is_active = true
  AND deleted = false;
