from fastapi import FastAPI
research_router=FastAPI()

@research_router.post("/research")