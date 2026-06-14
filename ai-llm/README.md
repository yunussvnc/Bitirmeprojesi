# AI-LLM Place Discovery Service

Semantic place search and recommendation service built for the `AsEmOs` graduation project. The repository combines a FastAPI service, a Qdrant-backed vector search layer, and an interactive CLI chatbot that understands natural-language venue requests in Turkish.

## Problem

Traditional location search is keyword-heavy and brittle. This project lets users describe intent in natural language, such as "sessiz wifi olan calisma mekani" or "deniz manzarali romantik aksam yemegi", then ranks venues by semantic similarity, nearby distance, and optional LLM reasoning.

## What It Does

- **Semantic Venue Search:** Natural language search with multilingual sentence embeddings.
- **Location-Aware Ranking:** Distance calculations with automatic GPS coordination and district filters.
- **Resilient Layered LLM Setup:** Groq Cloud (`llama-3.1-8b-instant`) with automatic fallback to local Gemma 2 or algorithmic scoring.
- **Smart Content Filtering:** Multi-language (7 languages: TR, EN, DE, FR, ES, AR, RU) filters to detect and block inappropriate inputs (politics, religion, slang).
- **Chit-chat Bypass:** Captures casual conversation queries (e.g., "naber", "hello") and responds with friendly, localized assistance instead of returning blank venue recommendations.
- **Redis Response Caching:** Speeds up response times (down to 75ms) by caching queries and bypassing embedding calculations for duplicate prompts.
- **Qdrant Vector Storage:** Auto-indexed and synced directly from the PostgreSQL backend database (with local JSON fallback).

## Architecture

```text
User query
  -> Check multi-language content filters (inappropriate/slang detection)
  -> Check chit-chat bypass (greeting/casual conversation detection)
  -> Check Redis query cache (returns in 75ms if hit)
  -> Calculate query embeddings (sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
  -> Semantic retrieval from Qdrant vector database
  -> Filter by district / location coordinates
  -> Apply AI recommendation history scoring (penalize previously recommended venues)
  -> Rank top-k candidates using similarity scores and distance weighting
  -> Generate natural language explanation using Layered LLM (Groq -> Gemma fallback)
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
- On Render, RAG can auto-index `data/loaded_places.json` into Qdrant. If `QDRANT_URL` is empty, the service uses in-memory Qdrant and rebuilds the index after each restart.

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
- `QDRANT_API_KEY` if using Qdrant Cloud
- `RAG_AUTO_INDEX=true`
- `RAG_INDEX_ON_STARTUP=false` for faster cold starts, or `true` to build the vector index during startup
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
| `/api/rag-search` | POST | RAG-only semantic venue search from the vector database |
| `/api/analyze-place-reviews` | POST | Review insight extraction |

## Render RAG Setup

For a persistent production RAG index, create a Qdrant Cloud cluster and set these Render environment variables:

```bash
QDRANT_URL=https://<cluster-url>
QDRANT_API_KEY=<qdrant-api-key>
QDRANT_COLLECTION_NAME=mekan_embeddings
RAG_AUTO_INDEX=true
RAG_INDEX_ON_STARTUP=false
RAG_DATA_PATH=data/loaded_places.json
```

If `QDRANT_URL` is left empty, `/api/rag-search` still works in demo mode: the service creates an in-memory vector database and loads the JSON snapshot lazily on the first RAG request. This survives within the same process, but Render restarts rebuild it.

To increase the local snapshot deliberately, run it only from a local environment that has `SERPAPI_KEY`:

```bash
python collect_400_places.py --target 600
python scripts/prepare_vector_db.py --json data/loaded_places.json --force
```

**Auto Postgres sync:** `collect_400_places.py` upserts to `places` when `DATABASE_URL` is set (use `--no-sync-postgres` to skip); on Render, `PLACES_SYNC_ON_STARTUP=true` re-syncs `loaded_places.json` if the DB count falls below 95% of the JSON snapshot.

## Demo Assets

Add screenshots or terminal captures under `screenshots/`:

- chatbot start screen
- example query and ranked output

## Notes

- The first request can be slow because the embedding or LLM model loads lazily
- The local CLI and the broader service share core retrieval pieces but support different operating modes
- Secrets must stay in `.env`; do not hardcode API keys into source files
