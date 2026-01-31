from datetime import datetime
from fastapi import FastAPI

app = FastAPI(title="Agent Service")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "agent_service",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
