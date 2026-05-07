# AI-LLM Place Discovery Service

Semantic place search and recommendation service built for the `AsEmOs` graduation project. The repository combines a FastAPI service, a Qdrant-backed vector search layer, and an interactive CLI chatbot that understands natural-language venue requests in Turkish.

## Problem

Traditional location search is keyword-heavy and brittle. This project lets users describe intent in natural language, such as "sessiz wifi olan calisma mekani" or "deniz manzarali romantik aksam yemegi", then ranks venues by semantic similarity, nearby distance, and optional LLM reasoning.

## What It Does

- Semantic venue search with multilingual sentence embeddings
- Location-aware ranking with distance calculation
- Interactive CLI chatbot with built-in example prompts and location presets
- Optional AI query analysis through a layered LLM setup
- Qdrant vector storage for retrieval and reusable test tooling

## Architecture

```text
User query
  -> sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
  -> semantic retrieval from Qdrant
  -> top-k filtering with thresholding
  -> distance calculation and ranking output
  -> optional LLM explanation (Groq -> local Gemma fallback)
```

## Results

Validated metrics from `docs/TEST_RESULTS.md`:

- 5/5 location-aware search tests passed
- 22 venues returned across the test suite
- 2.086 s average response time
- 75 ms fastest response after warm-up
- 10.033 s cold-start response on the first query
- 0.548 average similarity score
- 0.4 similarity threshold and top 5 result limit

Additional current system facts:

- Qdrant collection stores 198 real Istanbul venues in the service flow
- The interactive CLI supports popular preset locations such as Taksim, Kadikoy, Besiktas, Sultanahmet, and Nisantasi
- The chatbot can fall back from live search to local vector retrieval when needed

## Data

- `data/loaded_places.json`: loaded venue snapshot for local/vector-based testing
- `data/google_maps_places.json`: raw place data gathered from external search sources
- Source fields include venue name, category, address, coordinates, rating, and review count

## Tech Stack

- Python, FastAPI, Uvicorn
- Qdrant, Redis
- Sentence Transformers, Transformers, Torch
- Groq Cloud and local HuggingFace Gemma fallback
- SerpAPI / Google Maps data ingestion utilities

## Project Structure

```text
ai-llm/
├── app.py
├── chatbot_interaktif.py
├── env.example
├── requirements.txt
├── data/
├── docs/
├── scripts/
├── src/
│   ├── api/
│   ├── models/
│   ├── rag/
│   ├── recommendation/
│   └── vector_db/
└── tests/
```

## How To Run

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp env.example .env
```

Required runtime values depend on the mode you use:

- `QDRANT_URL`
- `SERPAPI_KEY` for live place search
- `GROQ_API_KEY` for the cloud LLM layer
- `GOOGLE_MAPS_API_KEY` only if you use Google Maps based scripts

### 3. Start the API service

```bash
uvicorn app:app --reload --port 8080
```

### 4. Run the interactive chatbot

```bash
python chatbot_interaktif.py
```

## Interactive CLI Commands

| Command | Description |
| --- | --- |
| Type any text | Search for a venue with natural language |
| `ornek` | Show sample prompt categories |
| `konum` | Change the current location |
| `yardim` | Print the help menu |
| `cikis` | Exit the chatbot |

## Example Queries

- `kahve icmek istiyorum`
- `yorgunum sessiz dinlenmek istiyorum`
- `ailecek gidebilecegimiz cocuk oyun alani olan`
- `deniz manzarali romantik aksam yemegi`

## API Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/health` | GET | Health check |
| `/api/info` | GET | Service stats and configuration info |
| `/api/smart-search-v2` | POST | Natural-language venue search |
| `/api/analyze-place-reviews` | POST | Review insight extraction |

## Demo Assets

Add screenshots or terminal captures under `screenshots/`:

- chatbot start screen
- example query and ranked output

## Notes

- The first request can be slow because the embedding or LLM model loads lazily
- The local CLI and the broader service share core retrieval pieces but support different operating modes
- Secrets must stay in `.env`; do not hardcode API keys into source files
