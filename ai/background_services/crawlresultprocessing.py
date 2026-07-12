from services.messagingservice import VectorEmbeddingMessanger
from services.articleontology import ArticleOntologyService
from services.graphservice import GraphService

class CrawlResultProcessingBackgroundService:
    def __init__(self,
                messaging: VectorEmbeddingMessanger, 
                onotology: ArticleOntologyService,
                graph: GraphService):
        self.messaging_service : VectorEmbeddingMessanger = messaging
        self.onotlogy_service : ArticleOntologyService = onotology
        self.graphy_service : GraphService = graph 

    def run_consumer(self):
        print(" [Worker Thread] Checking RabbitMQ connection...")
        mess_service : VectorEmbeddingMessanger = self.messaging_service
        if mess_service.can_connect():
            print(" [Worker Thread] Connection successful. Starting consumer loop...")
            # mess_service.consume(callback=lambda data: print(f" [Worker] Processed: {data}"))
            
            # onotology: ArticleOntologyService = app.state.onotology
            # onotlogyResponse = onotology.extract_ontology(result)
            # graph_service: GraphService = app.state.graph_service
            # sucessfull = graph_service.save_ontology(onotlogyResponse, llmResponse.title)
            # print(onotlogyResponse)
            
        else:
            print(" [Worker Thread] CRITICAL: Could not connect to RabbitMQ.")