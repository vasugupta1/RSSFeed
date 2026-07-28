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
        logger.info("=== SearchMCP.extract_with_search START ===")
        logger.info(f"Keywords received: {key_words}")
        logger.info(f"MCP client config: {self.mcp_client}")

        # Step 1: Get tools from MCP server
        try:
            logger.info("Connecting to MCP server to get tools...")
            tools = await self.mcp_client.get_tools()
            logger.info(f"Tools retrieved: {[t.name for t in tools]}")
        except Exception as e:
            logger.error(f"FAILED to get tools from MCP server: {type(e).__name__}: {e}", exc_info=True)
            raise

        # Step 2: Create agent
        try:
            logger.info("Creating agent...")
            agent = create_agent(
                model=self.llm,
                tools=tools,
                system_prompt=self.agent_system_prompt
            )
            logger.info("Agent created successfully")
        except Exception as e:
            logger.error(f"FAILED to create agent: {type(e).__name__}: {e}", exc_info=True)
            raise

        # Step 3: Invoke agent
        keywords_str = ", ".join(key_words)
        try:
            logger.info(f"Invoking agent with keywords: {keywords_str}")
            agent_result: dict[str, Sequence[Union[BaseMessage, AnyMessage]]] = await agent.ainvoke({
                "messages": [(
                    "user", 
                    f"Use the `web_search` tool to research and gather factual context for the following key entities and topics:\n"
                    f"Keywords: {keywords_str}\n\n"
                    f"Provide a comprehensive summary of the discovered entities, their descriptions, and how they relate to one another."
                    f"Each keyword, do search into what it is."
                )]
            })
            logger.info("Agent invocation completed")
        except Exception as e:
            logger.error(f"FAILED during agent invocation: {type(e).__name__}: {e}", exc_info=True)
            raise

        # Step 4: Extract messages
        messages = agent_result.get("messages", [])
        logger.info(f"Total messages returned: {len(messages)}")
        for i, msg in enumerate(messages):
            msg_type = type(msg).__name__
            content_preview = str(getattr(msg, 'content', ''))[:200]
            logger.info(f"  Message[{i}] type={msg_type}: {content_preview}")

        full_context: str = "\n".join([
            str(msg.content) for msg in messages 
            if hasattr(msg, "content") and msg.content
        ])

        logger.info(f"=== SearchMCP.extract_with_search END — context length: {len(full_context)} chars ===")
        return full_context