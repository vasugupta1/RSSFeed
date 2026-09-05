import logging
import os
from typing import Any
from fastapi import FastAPI, HTTPException, status, Depends
import uvicorn
from contextlib import asynccontextmanager
from repository.graphservice import GraphService
from factories.servicefactory import ServiceContainerBuilder
from config.appconfiguration import AppConfiguration
from handlers.getentitiesrelationship import *

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
config : AppConfiguration = AppConfiguration() # type: ignore[reportCallIssue]

@asynccontextmanager
async def lifespan(app: FastAPI):
    builder = ServiceContainerBuilder(config= config)
    container = (await builder.build_infrastructure())
    container = builder.build_api_handler().build()
    container.attach_to_app(app)
    app.state.container = container
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

@app.get("/api/relationship", response_model= GetEntitiesRelationshipResponse, status_code= status.HTTP_200_OK)
async def get_relationship(response: Response, query: GetEntitiesRelationshipQuery = Depends()) -> GetEntitiesRelationshipResponse:
      handler : GetEntitiesRelationshipHandler =  app.state.container.get_entities_relationship_handler
      return await handler.handle(query, response)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)