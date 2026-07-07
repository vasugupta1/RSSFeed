-- migrate:up
CREATE TABLE IF NOT EXISTS ontology_concepts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ontology_relations (
    id SERIAL PRIMARY KEY,
    source_id INT REFERENCES ontology_concepts(id) ON DELETE CASCADE,
    target_id INT REFERENCES ontology_concepts(id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL
);

-- migrate:down
DROP TABLE IF EXISTS ontology_relations;
DROP TABLE IF EXISTS ontology_concepts;