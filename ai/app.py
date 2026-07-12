import os
from fastapi import FastAPI, HTTPException, status
import uvicorn
from contextlib import asynccontextmanager
from crawl4ai import AsyncWebCrawler, BrowserConfig

from services.crawl import Crawl
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from services.crawl import Crawl
from services.articleontology import ArticleOntologyService
from services.graphservice import GraphService
from services.messagingservice import VectorEmbeddingMessanger
from config.appconfiguration import AppConfiguration

config : AppConfiguration = AppConfiguration() # type: ignore[reportCallIssue]

@asynccontextmanager
async def lifespan(app: FastAPI):
    browser_config = BrowserConfig(
        headless=True, 
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )
    shared_crawler : AsyncWebCrawler = AsyncWebCrawler(config=browser_config)
    await shared_crawler.start()
    app.state.crawler_service = Crawl(shared_crawler)
    app.state.llm = RSSAnalyserService(url=config.LLM_URI, model=config.LLM_MODEL, config = {})
    app.state.onotology = ArticleOntologyService(url=config.LLM_URI, model=config.LLM_MODEL, config = {})
    app.state.graph_service = GraphService(uri = config.DATABASE_URI)
    messaging_service : VectorEmbeddingMessanger = VectorEmbeddingMessanger(uri = config.MESSAGING_URI)
    app.state.messaging_service = messaging_service
    
    yield
    await shared_crawler.close()

app = FastAPI(lifespan=lifespan)

@app.get("/healthcheck")
def heartcheck():
    graph_service: GraphService = app.state.graph_service
    messaging_service : VectorEmbeddingMessanger = app.state.messaging_service
    service_result =  {}
    service_result["graph_database"] =  graph_service.can_connect()
    service_result["vector_embedding_queue"] = messaging_service.can_connect()

    if False in service_result.values():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "unhealthy", "checks": service_result}
        )

    return {"status": "healthy", "checks": service_result} 


@app.get("/api/crawl")
async def crawl(url: str):
    crawl_servie : Crawl = app.state.crawler_service
    crawl_result : str = await crawl_servie.run(url)
    llm :RSSAnalyserService = app.state.llm
    llmResponse: ArticleAnalysis = llm.analyze_text(crawl_result)
    messanger: VectorEmbeddingMessanger = app.state.messaging_service
    messanger.publish(crawl_result)
    
    # onotology: ArticleOntologyService = app.state.onotology
    # onotlogyResponse = onotology.extract_ontology(result)
    # graph_service: GraphService = app.state.graph_service
    # sucessfull = graph_service.save_ontology(onotlogyResponse, llmResponse.title)
    # print(onotlogyResponse)
  
    return {"url": url, 
            "title": llmResponse.title, 
            "summary": llmResponse.summary, 
            "keywords": llmResponse.keywords,
            "country": llmResponse.country}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)