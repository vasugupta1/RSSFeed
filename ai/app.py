import os
from fastapi import FastAPI, HTTPException, status
import uvicorn
from contextlib import asynccontextmanager
from crawl4ai import AsyncWebCrawler, BrowserConfig
import threading

from services.crawl import Crawl
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from services.crawl import Crawl
from services.articleontology import ArticleOntologyService
from services.graphservice import GraphService
from services.messagingservice import VectorEmbeddingMessanger
from background_services.crawlresultprocessing import CrawlResultProcessingBackgroundService
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
    onotlogy : ArticleOntologyService = ArticleOntologyService(url=config.LLM_URI, model=config.LLM_MODEL, config = {})
    app.state.onotology = onotlogy
    graph_service = GraphService(uri = config.DATABASE_URI)
    app.state.graph_service = graph_service
    messaging_service : VectorEmbeddingMessanger = VectorEmbeddingMessanger(uri = config.MESSAGING_URI)
    app.state.messaging_service = messaging_service

    consumer_thread = threading.Thread(target=CrawlResultProcessingBackgroundService(messaging_service, onotlogy, graph_service).run_consumer, daemon=True)
    consumer_thread.start()

    yield
    await shared_crawler.close()

app = FastAPI(lifespan=lifespan)

@app.get("/healthcheck")
def heartcheck():
    graph_service: GraphService = app.state.graph_service
    messaging_service : VectorEmbeddingMessanger = app.state.messaging_service
    service_result =  {}
    service_result["graph_database"] = "healthy" if graph_service.can_connect() else "unhealthy"
    service_result["vector_embedding_queue"] = "healthy" if  messaging_service.can_connect() else "unhealthy"

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
    
    return {"url": url, 
            "title": llmResponse.title, 
            "summary": llmResponse.summary, 
            "keywords": llmResponse.keywords,
            "country": llmResponse.country}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)