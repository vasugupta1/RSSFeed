from abc import ABC, abstractmethod
import requests
import json

class LLMService(ABC):
    def __init__(self, url:str, model:str, config:dict):
        if url and not url.endswith("/v1/chat/completions") and not url.endswith("/api/chat"):
            url = url.rstrip("/") + "/v1/chat/completions"
        self.url = url
        self.model = model
        self.config = config

    def call(self, message:str) ->str:
        payload = self._generate_payload(message)
        print(f"LLMService calling {self.url} with payload: {json.dumps(payload)}")  # Debug statement
        response = requests.post(self.url, json=payload)

        if response.status_code == 200:
            data = response.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            raise Exception(f"LLM API call failed with status code {response.status_code}: {response.text}")     
        
    def _generate_payload(self, message:str) -> dict:
        with open("prompts/summarise_articles.json", "r") as f:
            prompt_data = json.load(f)
        prompt_template = prompt_data["prompt_template"]
        generation_params = prompt_data["generation_params"]
        system_prompt = prompt_template.get("system", "")
        user_prompt = prompt_template.get("user", "").format(message=message)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            **generation_params
        }
        return payload