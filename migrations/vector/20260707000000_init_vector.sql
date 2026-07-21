-- migrate:up

-- 1. Initialize the pgvector extension inside the ressfeedvectors database
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Explicitly ensure the search path handles the public schema correctly for ressfeedvectors
ALTER DATABASE ressfeedvectors SET search_path = "$user", public;
SET search_path = "$user", public;

-- 3. Create the table for document chunks and vector embeddings
CREATE TABLE document_embeddings (
    id BIGSERIAL PRIMARY KEY,
    article_title VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    -- 768 dimensions explicitly maps to nomic-embed-text/Ollama defaults
    embedding vector(768) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create a Hierarchical Navigable Small World (HNSW) index for fast similarity lookups
-- Using Cosine Distance (<=>) operator mapping
CREATE INDEX IF NOT EXISTS doc_embeddings_hnsw_idx 
ON document_embeddings 
USING hnsw (embedding vector_cosine_ops);


-- migrate:down

-- Drop the index and table cleanly
DROP INDEX IF EXISTS doc_embeddings_hnsw_idx;
DROP TABLE IF EXISTS document_embeddings;