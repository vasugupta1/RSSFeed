import os
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

from contextlib import asynccontextmanager
from crawl4ai import AsyncWebCrawler, BrowserConfig
from services.crawl import Crawl
from services.llm import LLMService

from services.crawl import Crawl
from services.llm import LLMService

CHAT_URI = str(os.getenv("CHAT_URI")) 
CHAT_MODEL = str(os.getenv("CHAT_MODEL"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    browser_config = BrowserConfig(
        headless=True, 
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )
    shared_crawler : AsyncWebCrawler = AsyncWebCrawler(config=browser_config)
    await shared_crawler.start()
    app.state.crawler_service = Crawl(shared_crawler)
    app.state.llm_service = LLMService(url=CHAT_URI, model=CHAT_MODEL, config={})
    yield
    await shared_crawler.close()

app = FastAPI(lifespan=lifespan)

@app.get("/healthcheck")
def heartcheck():
    return {"status": "healthy"}

@app.get("/api/crawl")
async def crawl(url: str):
    result = await app.state.crawler_service.run(url)
    llm_response = app.state.llm_service.call(f"Summarize the crawl result: {result}")
    return {"Url": url, "Response": llm_response}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)