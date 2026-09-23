from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def generate(prompt, system_prompt=None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        temperature=0.3,
        max_tokens=4096
    )
    return response.choices[0].message.content
