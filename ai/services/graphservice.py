import psycopg2
from services.articleontology import ArticleOntology
from psycopg2.extras import execute_values

class GraphService:
    def __init__(self, uri: str):
        self.conn = psycopg2.connect(uri)

    def can_connect(self)-> bool:
        try:
            with self.conn.cursor() as cus:
                cus.execute("SELECT 1;")
                cus.fetchone()
                return True
        except Exception as e:
            print("Failed to connect to the datbase")
            return False
        
    def save_ontology(self, ontology: ArticleOntology, article_title: str) -> bool:
        """
        Parses a structured Pydantic ArticleOntology object and commits 
        it safely into the relational entities and relationships tables.
        """
        try:
            with self.conn.cursor() as cursor:
                # ---- Step 1: Bulk Insert Entities ----
                # Transform Pydantic models to tuples for psycopg2
                entity_data = [(e.name, e.type) for e in ontology.entities]
                
                insert_entities_query = """
                    INSERT INTO entities (name, type)
                    VALUES %s
                    ON CONFLICT (name) DO UPDATE 
                    SET type = EXCLUDED.type; -- Updates the type category if it evolved
                """
                # execute_values is significantly faster than a generic for-loop
                execute_values(cursor, insert_entities_query, entity_data)

                # ---- Step 2: Bulk Insert Relationships ----
                relationship_data = [
                    (r.source, r.target, r.relation_type, article_title)
                    for r in ontology.relationships
                ]
                
                insert_relationships_query = """
                    INSERT INTO relationships (source_name, target_name, relation_type, article_title)
                    VALUES %s
                    ON CONFLICT (source_name, target_name, relation_type) DO NOTHING;
                """
                execute_values(cursor, insert_relationships_query, relationship_data)

            # Commit the entire transaction atomically
            self.conn.commit()
            print(f"Successfully synchronized {len(ontology.entities)} entities to the graph.")
            return True

        except Exception as e:
            # If anything breaks (e.g., LLM hallucinations violating FK paths), rollback completely
            self.conn.rollback()
            print(f"Transaction rolled back. Error saving ontology: {e}")
            return False

    def close(self):
        if self.conn:
            self.conn.close()