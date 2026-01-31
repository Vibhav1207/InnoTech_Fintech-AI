# Agent Service (FastAPI)

## Setup

Create and use the virtual environment:

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health: http://localhost:8000/health
