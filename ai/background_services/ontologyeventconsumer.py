
from services.articleontology import ArticleOntologyService
from repository.graphservice import GraphService
import logging

logger = logging.getLogger(__name__)

class OntologyEventConsumer:
    def __init__(self,onotology: ArticleOntologyService,graph: GraphService):
        self.onotlogy_service : ArticleOntologyService = onotology
        self.graphy_service : GraphService = graph 
