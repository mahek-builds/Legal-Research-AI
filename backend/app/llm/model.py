from groq import Groq
from app.config import settings
import json
import logging

logger = logging.getLogger(__name__)

# Lazy client — initialized on first use so uvicorn can bind to the port first
_client = None

def _get_client():
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY is not set.")
            return None
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client

def generate(prompt, system_prompt=None):
    client = _get_client()
    if client is None:
        return json.dumps({
            "summary": "GROQ_API_KEY is not configured on the server.",
            "relevant_facts": [],
            "legal_issues": [],
            "applicable_law": [],
            "analysis": "Please set the GROQ_API_KEY environment variable in your deployment settings.",
            "conclusion": "Configuration required."
        })

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=4096
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq generation error: {e}")
        return json.dumps({
            "summary": f"Generation failed: {str(e)}",
            "relevant_facts": [],
            "legal_issues": [],
            "applicable_law": [],
            "analysis": f"An error occurred while calling the LLM API: {str(e)}",
            "conclusion": "Please check your LLM_MODEL and GROQ_API_KEY configuration."
        })
