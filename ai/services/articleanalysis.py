from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict, Any, cast

class ArticleAnalysis(BaseModel):
    title: str = Field(
        description="The original headline or title of the article as it appears on the page. Do NOT use generic labels like 'Summary'."
    )
    bullet_point_summary: List[str] = Field(
        description= "Concise bulleted summary with strict formatting rules, present the summary exclusively as a clean list of bullet points in markdown format (using '-' or '*' for bullets) Keep each bullet point concise, punchy, and fact-focused Do not include any introductory text, pleasantries, or concluding remarks. Avoid conversational filler; output only the bulleted list."
    )
    summary: List[str] = Field(
        description="A list of concise, punchy, fact-focused bullet points summarizing the article."
    )
    keywords: List[str] = Field(
        description="Main themes, topics, or entities extracted from the HTML content."
    )
    country : str = Field( description= "The country of origin where this html content is from.")


class RSSAnalyserService:

    def __init__(self, url:str, model:str, config:dict):
        self.llm = ChatOllama(model=model, base_url=url, temperature=0.0)

        self.structured_llm = self.llm.with_structured_output(
            ArticleAnalysis,
            method="json_schema"
        )

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert AI analyzer. Analyze the provided HTML text and extract the article's original title, a concise bullet-point summary, country of origin and relevant keywords. Fill every field strictly according to the schema."),
            ("human", "Analyze this article content: {message}")
        ])

        self.chain = self.prompt | self.structured_llm


    def analyze_text(self, text_content: str) -> ArticleAnalysis:
        response = self.chain.invoke({"message": text_content})
        return cast(ArticleAnalysis, response)