import os
from fastapi import FastAPI, HTTPException, status
import uvicorn
from contextlib import asynccontextmanager
from crawl4ai import AsyncWebCrawler, BrowserConfig
import threading
import asyncio

from services.crawl import Crawl
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from services.crawl import Crawl
from services.articleontology import ArticleOntologyService
from services.graphservice import GraphService
from services.messagingservice import MessagingService
from background_services.crawleventconsumer import CrawlEventConsumer
from services.embedding import EmbeddingService

from config.appconfiguration import AppConfiguration

config : AppConfiguration = AppConfiguration() # type: ignore[reportCallIssue]

@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()

    browser_config = BrowserConfig(
        headless=True, 
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )
    shared_crawler : AsyncWebCrawler = AsyncWebCrawler(config=browser_config)
    await shared_crawler.start()
    app.state.crawler_service = Crawl(shared_crawler)
    app.state.llm = RSSAnalyserService(url=config.LLM_URI, model=config.LLM_MODEL, config = {})
    app.state.embedding_service = EmbeddingService(model_uri= config.EMBEDDING_URI, model_name= config.EMBEDDING_MODEL, vector_store_connection_string= config.VECTOR_DATBASE_URI)
    onotlogy : ArticleOntologyService = ArticleOntologyService(url=config.LLM_URI, model=config.LLM_MODEL, config = {})
    app.state.onotology = onotlogy
    graph_service = GraphService(uri = config.DATABASE_URI)
    app.state.graph_service = graph_service
    

    app.state.crawl_event_messaging = MessagingService(uri = config.MESSAGING_URI, queue_name= config.CRAWL_QUEUE)

    app.state.crawl_event_result_messaging = MessagingService(uri = config.MESSAGING_URI, queue_name= config.CRAWL_RESULT_QUEUE)


    consumer_thread = threading.Thread(target=CrawlEventConsumer(
        app.state.crawl_event_messaging, 
        app.state.crawl_event_result_messaging, 
        app.state.crawler_service , 
        app.state.llm, 
        app.state.embedding_service, 
        loop).run_consumer, daemon=True)
    consumer_thread.start()

    # consumer_thread = threading.Thread(target=CrawlResultProcessingBackgroundService(messaging_service, onotlogy, graph_service).run_consumer, daemon=True)
    # consumer_thread.start()

    yield
    await shared_crawler.close()

app = FastAPI(lifespan=lifespan)

@app.get("/healthcheck")
def heartcheck():
    service_result =  {}
    service_result["graph_database"] = "healthy" if app.state.graph_service.can_connect() else "unhealthy"
    service_result["crawl_event_queue"] = "healthy" if  app.state.crawl_event_messaging.can_connect() else "unhealthy"
    service_result["crawl_result_event_queue"] = "healthy" if  app.state.crawl_event_result_messaging.can_connect() else "unhealthy"
    service_result["vector_embedding_database"] = "healthy" if  app.state.embedding_service.can_connect() else "unhealthy"

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
    article_analysis: ArticleAnalysis = llm.analyze_text(crawl_result)
    # messanger: VectorEmbeddingMessanger = app.state.messaging_service
    # messanger.publish(article_analysis.model_dump())
    
    return {"url": url, 
            "title": article_analysis.title, 
            "summary": article_analysis.summary, 
            "keywords": article_analysis.keywords,
            "country": article_analysis.country}


@app.get("/api/relationship")
async def relationship():
    test : EmbeddingService = app.state.embedding_service
    reslt = test.search("Football", 5)
    return {"test": reslt}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)