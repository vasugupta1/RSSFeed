import psycopg2


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
       
    def close(self):
        if self.conn:
            self.conn.close()