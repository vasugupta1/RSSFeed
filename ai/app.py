import os
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

from contextlib import asynccontextmanager
from crawl4ai import AsyncWebCrawler, BrowserConfig
from features.crawl.crawl import Crawl
from services.llm import LLMService

from features.crawl.crawl import Crawl
from services.llm import LLMService

CHAT_URI = os.getenv("CHAT_URI") 
CHAT_MODEL = os.getenv("CHAT_MODEL")

@asynccontextmanager
async def lifespan(app: FastAPI):
    browser_config = BrowserConfig(
        headless=True, 
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )
    shared_crawler : AsyncWebCrawler = AsyncWebCrawler(config=browser_config)
    await shared_crawler.start()
    app.state.shared_crawler = shared_crawler
    yield
    await shared_crawler.close()

app = FastAPI(lifespan=lifespan)

@app.get("/healthcheck")
def heartcheck():
    return {"status": "healthy"}

@app.get("/api/crawl")
async def crawl(url: str):
    shared_crawler = app.state.shared_crawler
    crawler = Crawl(url, shared_crawler)
    result = await crawler.run()
    llm_service = LLMService(url=CHAT_URI, model=CHAT_MODEL, config={})
    llm_response = llm_service.call(f"Summarize the crawl result: {result}")
    return {"url": url, "result": llm_response}

if __name__ == "__main__":
    # Aspire automatically passes configured ports, but we fallback to 8000
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)