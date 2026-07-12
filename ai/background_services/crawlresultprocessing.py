from services.messagingservice import VectorEmbeddingMessanger
from services.articleontology import ArticleOntologyService
from services.graphservice import GraphService
from services.articleanalysis import ArticleAnalysis
import logging

class CrawlResultProcessingBackgroundService:
    def __init__(self,
                messaging: VectorEmbeddingMessanger, 
                onotology: ArticleOntologyService,
                graph: GraphService):
        self.messaging_service : VectorEmbeddingMessanger = messaging
        self.onotlogy_service : ArticleOntologyService = onotology
        self.graphy_service : GraphService = graph 


    def _process_message(self, result:ArticleAnalysis) -> None:
        '''1. Get article crawl result'''
        '''2. use ontology service to  get current doc onotlogy and keywords'''
        '''3. for each entities and relationship get doc from vector database'''
        '''4. pass all the docs and create an update new ontology on it'''

        # onotlogyResponse = self.onotlogy_service.extract_ontology(result)
        print(result)

        pass



    def run_consumer(self):
        print(" [Worker Thread] Checking RabbitMQ connection...")
        mess_service : VectorEmbeddingMessanger = self.messaging_service
        if mess_service.can_connect():
            print(" [Worker Thread] Connection successful. Starting consumer loop...")
            self.messaging_service.comsume(callback=self._process_message)
        else:
            print(" [Worker Thread] CRITICAL: Could not connect to RabbitMQ.")
        pass