from typing import cast

from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from pydantic import BaseModel


class ResearchGeneratorResult(BaseModel):
    search_queries: list[str]


class ResearchGeneratorService:

    def __init__(self, url: str, model: str):
        self.llm = ChatOllama(
            model=model,
            base_url=url,
            temperature=0.0,
        )

        self.structured_llm = self.llm.with_structured_output(
            ResearchGeneratorResult,
            method="json_schema",
        )

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """
You are an expert research analyst and search-query strategist.

You will be given a SHORT SUMMARY of an article extracted from crawled HTML.

Your task is NOT to summarize the article.

Your task is to determine what should be searched for next in order to
research the article's topic more deeply.

Generate 5 to 10 high-quality search queries that can be sent directly
to DuckDuckGo.

The queries should:

- Explore the central topic from multiple angles.
- Help verify important claims in the article.
- Find additional context and background.
- Investigate important people, companies, organizations, technologies,
  products, or events mentioned.
- Find relevant technical information, research, statistics, reports,
  or primary sources when appropriate.
- Explore competing perspectives, alternatives, competitors, or related
  developments when relevant.
- Prefer specific queries over generic queries.
- Avoid simply repeating the article summary.
- Avoid duplicate or nearly identical queries.
- Each query must work as a standalone DuckDuckGo search.
- Do not invent facts that are not supported by the provided information.
- Prioritize queries that are likely to discover NEW information.

Use the title, country, keywords, and article summary together to
understand the research context.

Think like a journalist or researcher deciding what searches to perform
after reading the article.

Return only the structured output defined by the schema.
""",
                ),
                (
                    "human",
                    """
Research the following article:

Title:
{title}

Country:
{country}

Keywords:
{keywords}

Article summary:
{message}

Generate the most useful DuckDuckGo search queries for researching
this article and its broader topic.
""",
                ),
            ]
        )

        self.chain = self.prompt | self.structured_llm

    async def generate_queries(
        self,
        summary: list[str],
        keywords: list[str],
        country: str,
        title: str,
    ) -> ResearchGeneratorResult:
        response = await self.chain.ainvoke(
            {
                "message": ", ".join(summary),
                "keywords": ", ".join(keywords),
                "country": country,
                "title": title,
            }
        )

        return cast(ResearchGeneratorResult, response)