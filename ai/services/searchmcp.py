from typing import List, Sequence, Union, Optional
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent
from langchain_ollama import ChatOllama
from langchain_core.tools import BaseTool
from langchain_core.messages import BaseMessage, AnyMessage

class SearchMCP:
    def __init__(self, mcp_server_url: str, model: str, url:str ) -> None:
        self.mcp_client : MultiServerMCPClient = MultiServerMCPClient({
            "search_mcp": {
                "transport": "sse",
                "url": mcp_server_url,
            }
        })
        self.agent_system_prompt : str = (
                "You are an ontology research agent. Your goal is to analyze text and build a high-quality knowledge graph. "
                "If an entity, acronym, company, or relationship in the text is ambiguous, missing background, or unclear, "
                "use the `web_search` tool to gather factual context before providing your final research output."
            )
        self.llm : ChatOllama = ChatOllama(model=model, base_url=url, temperature=0.0)

    async def extract_with_search(self, text_content:str) -> str:
        agent = create_agent(
            model=self.llm,
            tools=self.mcp_client.get_tools(),
            system_prompt=self.agent_system_prompt
        )
        agent_result : dict[str, Sequence[Union[BaseMessage, AnyMessage]]] = await agent.ainvoke({
            "messages": [("user", f"Research and enrich the entities and relationships in this article:\n\n{text_content}")]
        })
        messages = agent_result.get("messages", [])
        
        full_context: str = "\n".join([
            str(msg.content) for msg in messages 
            if hasattr(msg, "content") and msg.content
        ])

        return full_context