from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import dashboard, prospects, deals, activities, search, agent

app = FastAPI(title="AI Sales Prospecting CRM", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(prospects.router)
app.include_router(deals.router)
app.include_router(activities.router)
app.include_router(search.router)
app.include_router(agent.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
