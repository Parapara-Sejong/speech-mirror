# Speech Mirror

Speech Mirror is a React frontend scaffold for polling speech analysis results from a backend API.

## What is here

- React 19 + TypeScript + Vite
- Tailwind CSS
- Axios API client
- TanStack Query polling for analysis status
- Zustand for the selected analysis ID

## Run

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env.local` if the backend is not running on `http://localhost:8080`.

## Useful commands

```bash
npm run build
npm run lint
npm run format
```

## API expected by the frontend

The current UI polls:

```text
GET /analyses/:analysisId
```

and expects an analysis result with `id`, `status`, timestamps, and optional `transcript` or `summary`.
