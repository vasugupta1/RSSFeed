from typing import List, Sequence, Union, Optional
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent
from langchain_ollama import ChatOllama
from langchain_core.tools import BaseTool
from langchain_core.messages import BaseMessage, AnyMessage
import logging

logger = logging.getLogger(__name__)

class SearchMCP:
    def __init__(self, mcp_server_url: str, model: str, url: str) -> None:
        self.mcp_client = MultiServerMCPClient({
            "search_mcp": {
                "transport": "streamable_http",
                "url": f"{mcp_server_url}/mcp",
            }
        })
        self.agent_system_prompt = (
            "You are an ontology research agent. Your goal is to analyze text and build a high-quality knowledge graph. "
            "If an entity, acronym, company, or relationship in the text is ambiguous, missing background, or unclear, "
            "use the `web_search` tool to gather factual context before providing your final research output."
        )
        self.llm = ChatOllama(model=model, base_url=url, temperature=0.0)

    async def extract_with_search(self, key_words: List[str]) -> str:
        logger.info("Starting starting mcp call processing")
        tools = await self.mcp_client.get_tools()
        agent = create_agent(
            model=self.llm,
            tools=tools,
            system_prompt=self.agent_system_prompt
        )
        
        # Format list into a clean, readable string for the prompt
        keywords_str = ", ".join(key_words)
        
        agent_result: dict[str, Sequence[Union[BaseMessage, AnyMessage]]] = await agent.ainvoke({
            "messages": [(
                "user", 
                f"Use the `web_search` tool to research and gather factual context for the following key entities and topics:\n"
                f"Keywords: {keywords_str}\n\n"
                f"Provide a comprehensive summary of the discovered entities, their descriptions, and how they relate to one another."
            )]
        })
        
        messages = agent_result.get("messages", [])
        
        full_context: str = "\n".join([
            str(msg.content) for msg in messages 
            if hasattr(msg, "content") and msg.content
        ])

        return full_context