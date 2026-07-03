from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict, Any, cast

class ArticleAnalysis(BaseModel):
    summary: List[str] = Field(
        description="A list of concise, punchy, fact-focused bullet points summarizing the article."
    )
    keywords: List[str] = Field(
        description="Main themes, topics, or entities extracted from the HTML content."
    )

class RSSAnalyserService:

    def __init__(self, url:str, model:str, config:dict):
        if url and not url.endswith("/v1/chat/completions") and not url.endswith("/api/chat"):
            url = url.rstrip("/") + "/v1/chat/completions"
        self.llm = ChatOllama(model= model, base_url= url, temperature=0.0, **config)

        self.structured_llm = self.llm.with_structured_output(
            ArticleAnalysis,
            method="json_schema"
        )

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert AI analyzer. Analyze the provided HTML text and extract a clean summary and relevant keywords strictly according to the schema."),
            ("human", "Analyze this article content: {message}")
        ])

        self.chain = self.prompt | self.structured_llm


    def analyze_text(self, text_content: str) -> ArticleAnalysis:
        response = self.chain.invoke({"message": text_content})
        return cast(ArticleAnalysis, response)


    

