from groq import Groq
from app.config import settings

# Lazy client — initialized on first use so uvicorn can bind to the port first
_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client

def generate(prompt, system_prompt=None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = _get_client().chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        temperature=0.3,
        max_tokens=4096
    )
    return response.choices[0].message.content
