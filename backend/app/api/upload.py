from fastapi import FastAPI
upload_router=FastAPI()

@upload_router.post("/upload")
