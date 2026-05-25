import os
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI()

@app.get("/healthcheck")
def heartcheck():
    return {"status": "healthy"}


if __name__ == "__main__":
    # Aspire automatically passes configured ports, but we fallback to 8000
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)