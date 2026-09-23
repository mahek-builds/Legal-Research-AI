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

import time

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

    # Qwen on Groq free tier has a strict 1,000 output tokens/min limit
    if "qwen" in settings.LLM_MODEL.lower():
        max_tokens = 850
    else:
        max_tokens = 2048

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            err_str = str(e)
            logger.error(f"Groq generation error (attempt {attempt + 1}/{max_retries}): {err_str}")
            if "429" in err_str or "rate_limit" in err_str.lower():
                if attempt < max_retries - 1:
                    wait_sec = 4 * (attempt + 1)
                    logger.info(f"Rate limit hit for {settings.LLM_MODEL}. Waiting {wait_sec}s before retry...")
                    time.sleep(wait_sec)
                    continue
            return json.dumps({
                "summary": f"Generation failed: {err_str}",
                "relevant_facts": [],
                "legal_issues": [],
                "applicable_law": [],
                "analysis": f"An error occurred while calling the LLM API: {err_str}",
                "conclusion": "Please check your LLM_MODEL and GROQ_API_KEY configuration."
            })
