-- migrate:up

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Configure the search path
ALTER DATABASE ressfeedvectors SET search_path = "$user", public;
SET search_path = "$user", public;

-- Create the HNSW index only if LangChain has already created its table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = 'langchain_pg_embedding'
    ) THEN
        CREATE INDEX IF NOT EXISTS langchain_pg_embedding_hnsw_idx
        ON public.langchain_pg_embedding
        USING hnsw (embedding vector_cosine_ops);
    END IF;
END
$$;


-- migrate:down

DROP INDEX IF EXISTS public.langchain_pg_embedding_hnsw_idx;