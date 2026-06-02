-- V5: Add document_type column to documents_upload table
-- This allows tracking what type of document was uploaded (PASSPORT, TRANSCRIPT, CV, etc.)
-- without requiring a document_workflow record to exist.

ALTER TABLE documents_upload
    ADD COLUMN IF NOT EXISTS document_type VARCHAR(100);

-- Create index for fast lookups by student + document type
CREATE INDEX IF NOT EXISTS idx_documents_upload_uploaded_by_doc_type
    ON documents_upload(uploaded_by, document_type);
