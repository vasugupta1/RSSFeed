import os
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
import uvicorn

from contextlib import asynccontextmanager
from crawl4ai import AsyncWebCrawler, BrowserConfig
from services.crawl import Crawl
from services.articleanalysis import RSSAnalyserService, ArticleAnalysis
from services.crawl import Crawl
from services.articleontology import ArticleOntologyService
from services.graphservice import GraphService

CHAT_URI = str(os.getenv("CHAT_URI")) 
CHAT_MODEL = str(os.getenv("CHAT_MODEL"))
ONTOLOGY_URI = str(os.getenv("ONOTOLOGY_URI"))
ONTOLOGY_MODEL = str(os.getenv("ONOTOLOGY_MODEL"))
DATABASE_URI = str(os.getenv("RSSFEEDONTOLOGY_URI"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    browser_config = BrowserConfig(
        headless=True, 
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )
    shared_crawler : AsyncWebCrawler = AsyncWebCrawler(config=browser_config)
    await shared_crawler.start()
    app.state.crawler_service = Crawl(shared_crawler)
    app.state.llm = RSSAnalyserService(url=CHAT_URI, model=CHAT_MODEL, config = {})
    app.state.onotology = ArticleOntologyService(url=ONTOLOGY_URI, model=ONTOLOGY_MODEL, config = {})
    app.state.graph_service = GraphService(uri = DATABASE_URI)
    
    yield
    await shared_crawler.close()

app = FastAPI(lifespan=lifespan)

@app.get("/healthcheck")
def heartcheck():
    graph_service: GraphService = app.state.graph_service
    service_result =  {}
    service_result["graph_service"] =  graph_service.can_connect()

    if False in service_result.values():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "unhealthy", "checks": service_result}
        )

    return {"status": "healthy", "checks": service_result} 


@app.get("/api/crawl")
async def crawl(url: str):
    result = await app.state.crawler_service.run(url)
    llm :RSSAnalyserService = app.state.llm
    onotology: ArticleOntologyService = app.state.onotology
    llmResponse: ArticleAnalysis = llm.analyze_text(result)
    onotlogyResponse = onotology.extract_ontology(result)
    graph_service: GraphService = app.state.graph_service
    sucessfull = graph_service.save_ontology(onotlogyResponse, llmResponse.title)
    print(onotlogyResponse)
  
    return {"url": url, 
            "title": llmResponse.title, 
            "summary": llmResponse.summary, 
            "keywords": llmResponse.keywords,
            "country": llmResponse.country}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)