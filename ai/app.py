import logging
import os
from fastapi import FastAPI, HTTPException, status
import uvicorn
from contextlib import asynccontextmanager
import threading
import asyncio
from services.articleontology import ArticleOntologyService
from factories.servicefactory import ServiceContainerBuilder
from config.appconfiguration import AppConfiguration
from services.searchservice import SearchService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
config : AppConfiguration = AppConfiguration() # type: ignore[reportCallIssue]

@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()

    builder = ServiceContainerBuilder(config= config)
    container = (await builder.build_infrastructure())
    container = (
        builder.build_messaging()
               .build_domain_services()
               .build_crawl_event_background_service(loop)
               .build_crawl_research_event_background_service(loop)
               .build()
    )
    container.attach_to_app(app)
    app.state.container = container

    consumer_thread = None
    if container.crawl_event_consumer:
        consumer_thread = threading.Thread(
            target=container.crawl_event_consumer.run_consumer, 
            daemon=True
        )
        consumer_thread.start()

    research_event_consume = None
    if container.crawl_research_event_consumer:
        research_event_consume = threading.Thread(
            target = container.crawl_research_event_consumer.run_consumer,
            daemon= True
        )
        research_event_consume.start()

    yield

    await container.cleanup()

app = FastAPI(lifespan=lifespan)

@app.get("/healthcheck")
def healthcheck():
    container = app.state.container
    service_result =  {}
    service_result["graph_database"] = "healthy" if container.graph_service.can_connect() else "unhealthy"
    service_result["crawl_event_queue"] = "healthy" if container.crawl_event_messaging.can_connect() else "unhealthy"
    service_result["crawl_result_event_queue"] = "healthy" if container.crawl_event_result_messaging.can_connect() else "unhealthy"
    service_result["vector_embedding_database"] = "healthy" if container.embedding_service.can_connect() else "unhealthy"

    if "unhealthy" in service_result.values():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "unhealthy", "checks": service_result}
        )

    return {"status": "healthy", "checks": service_result} 

@app.get("/api/relationship")
async def relationship():
    test : ArticleOntologyService = app.state.onotlogy
    result =  await test.extract_ontology("fifa")
    print(result)
    return {"test": result}

@app.get("/api/search")
async def search():
    container = app.state.container
    search_service : SearchService = container.search_service
    results = [result async for result in search_service.web_search("fifa")]
    print(results)
    return results
    

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)