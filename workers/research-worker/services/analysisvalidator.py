from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import cast


class ValidationVerdict(BaseModel):
    """LLM's assessment of analysis quality against source content."""
    is_valid: bool = Field(
        description="True if the analysis faithfully and adequately represents the source content."
    )
    problem_type: str | None = Field(
        default=None,
        description=(
            "If is_valid is False, one of: "
            "'content_issue' (source text is a paywall, cookie wall, "
            "login page, or too garbled to analyse properly) or "
            "'analysis_issue' (source is fine but the analysis is "
            "hallucinated, inaccurate, or incomplete)."
        )
    )
    reasons: list[str] = Field(
        default_factory=list,
        description=(
            "Specific problems found, e.g. "
            "'title does not match article headline', "
            "'keywords include terms not present in article', "
            "'summary contains claims not supported by source text'."
        )
    )


class AnalysisValidator:

    def __init__(self, url: str, model: str):
        self.llm = ChatOllama(model=model, base_url=url, temperature=0.0)

        self.structured_llm = self.llm.with_structured_output(
            ValidationVerdict,
            method="json_schema"
        )

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are a strict quality-assurance reviewer for article analysis. "
                "You will receive the original article text (markdown) and a structured analysis of that article.\n\n"
                "Verify the following:\n"
                "- Does the title match the article's actual headline or topic?\n"
                "- Are the keywords genuinely present in or relevant to the article content?\n"
                "- Does the summary accurately reflect the article content without hallucination?\n"
                "- Does the article_overview faithfully capture the key points of the source?\n"
                "- Is the country extraction plausible given the article content?\n"
                "- Is the source content itself actually an article? "
                "(It should NOT be a paywall page, login page, cookie consent wall, "
                "error page, or navigation menu.)\n\n"
                "Classification rules:\n"
                "- If the source content itself is the problem (not a real article, paywall, "
                "cookie wall, login gate, garbled text), set problem_type to 'content_issue'.\n"
                "- If the source content is a legitimate article but the analysis is inaccurate, "
                "hallucinated, or incomplete, set problem_type to 'analysis_issue'.\n"
                "- If everything looks good, set is_valid to true."
            )),
            ("human", (
                "## Original Article Content\n"
                "{source_markdown}\n\n"
                "## Structured Analysis to Validate\n"
                "Title: {title}\n"
                "Keywords: {keywords}\n"
                "Summary: {summary}\n"
                "Bullet Point Summary: {bullet_point_summary}\n"
                "Article Overview: {article_overview}\n"
                "Country: {country}"
            ))
        ])

        self.chain = self.prompt | self.structured_llm

    async def validate(
        self,
        source_markdown: str,
        title: str,
        summary: list[str],
        bullet_point_summary: list[str],
        keywords: list[str],
        article_overview: str,
        country: str,
    ) -> ValidationVerdict:
        response = await self.chain.ainvoke({
            "source_markdown": source_markdown,
            "title": title,
            "keywords": ", ".join(keywords) if keywords else "",
            "summary": "\n".join(summary) if summary else "",
            "bullet_point_summary": "\n".join(bullet_point_summary) if bullet_point_summary else "",
            "article_overview": article_overview or "",
            "country": country or "",
        })
        return cast(ValidationVerdict, response)
