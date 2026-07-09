-- migrate:up

CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store the directed edges connecting them
CREATE TABLE relationships (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(255) REFERENCES entities(name) ON DELETE CASCADE,
    target_name VARCHAR(255) REFERENCES entities(name) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    article_title VARCHAR(255), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_rel UNIQUE (source_name, target_name, relation_type)
);

-- migrate:down

-- Drop the dependent table first to prevent Foreign Key constraint blocks
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS entities;