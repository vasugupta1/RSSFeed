import os
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

from features.crawl.crawl import Crawl
from services.llm import LLMService

CHAT_URI = os.getenv("CHAT_URI") 
CHAT_MODEL = os.getenv("CHAT_MODEL")

app = FastAPI()

@app.get("/healthcheck")
def heartcheck():
    return {"status": "healthy"}

@app.get("/api/crawl")
async def crawl(url: str):
    crawler = Crawl(url)
    result = await crawler.run()
    llm_service = LLMService(url=CHAT_URI, model=CHAT_MODEL, config={})
    llm_response = llm_service.call(f"Summarize the crawl result: {result}")
    return {"url": url, "result": llm_response}

if __name__ == "__main__":
    # Aspire automatically passes configured ports, but we fallback to 8000
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)