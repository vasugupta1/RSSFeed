from abc import ABC, abstractmethod
from ollama import chat
from ollama import ChatResponse

class LLMService(ABC):
    def __init__(self, url:str, model:str, config:dict):
        self.url = url
        self.model = model
        self.config = config

    def call(self, message:str) ->str:
        response: ChatResponse = chat(
            model=self.model,
            url=self.url,
            messages=[{"role": "user", "content": message}],
        )
        return response.choices[0].message.content
