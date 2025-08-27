# PDF Converter

Live Demo: [pdf-to-and-from-converter](https://pdf-to-and-from-converter.vercel.app/)

A modern web app to convert files to and from PDF with a clean, responsive UI and a secure server-side API proxy.

## Overview

This app lets you:

- Upload files via drag-and-drop (DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, PNG/JPG and more)
- Convert to PDF or from PDF to other formats
- Track progress and see clear success/error states
- Download converted files securely

Under the hood, the frontend calls a Next.js API route that integrates with PDF.co. Your API key is kept server-side for safety.

## Tech Stack

- Next.js (App Router), React, TypeScript
- shadcn/ui + Radix primitives for UI
- PDF.co for conversion (proxied via Next.js API route)

## Project Structure

- `app/` — Next.js routes (including `api/convert` and `api/hello`)
- `components/` — UI components (upload, conversion panel, download section)
- `lib/` — Client-side service helpers (e.g., conversion service)
- `public/` — Static assets

## Environment Variables

Create `.env.local` (do not commit) and set:

- `PDF_CO_API_KEY` — your PDF.co API key

An example file is provided as `.env.local.example`.

## Getting Started

1. Install dependencies

```powershell
pnpm install
```

2. Configure environment

```powershell
Copy-Item .env.local.example .env.local
# Open .env.local and set PDF_CO_API_KEY
```

3. Run the dev server

```powershell
pnpm dev
```

Open <http://localhost:3000> (or the port shown in the console).

4. Build and run in production (optional)

```powershell
pnpm run build
pnpm start
```

## How It Works

- The client reads files and sends a minimal payload to `/api/convert`.
- The server route calls PDF.co endpoints. When an endpoint requires a URL, the server uploads the file to PDF.co temporary storage and retries with the returned URL.
- The route responds with secure download URLs that the UI presents in the Download section.

## Notes

- API keys are used only on the server and never exposed to the browser.
- Some from-PDF conversions may fall back to text if a specific format isn’t supported by the current provider.
Live Demo: <https://your-deployment-url.example>

# PDF Converter

A modern web app to convert files to and from PDF with a clean, responsive UI and a secure server-side API proxy.

## Overview

This app lets you:

- Upload files via drag-and-drop (DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, PNG/JPG and more)
- Convert to PDF or from PDF to other formats
- Track progress and see clear success/error states
- Download converted files securely

Under the hood, the frontend calls a Next.js API route that integrates with PDF.co. Your API key is kept server-side for safety.

## Tech Stack

- Next.js (App Router), React, TypeScript
- shadcn/ui + Radix primitives for UI
- PDF.co for conversion (proxied via Next.js API route)

## Project Structure

- `app/` — Next.js routes (including `api/convert` and `api/hello`)
- `components/` — UI components (upload, conversion panel, download section)
- `lib/` — Client-side service helpers (e.g., conversion service)
- `public/` — Static assets

## Environment Variables

Create `.env.local` (do not commit) and set:

- `PDF_CO_API_KEY` — your PDF.co API key

An example file is provided as `.env.local.example`.

## Getting Started

1) Install dependencies

```powershell
pnpm install
```

2) Configure environment

```powershell
Copy-Item .env.local.example .env.local
# Open .env.local and set PDF_CO_API_KEY
```

3) Run the dev server

```powershell
pnpm dev
```

Open http(s)://localhost:3000 (or the port shown in the console).

4) Build and run in production (optional)

```powershell
pnpm run build
pnpm start
```

## How It Works

- The client reads files and sends a minimal payload to `/api/convert`.
- The server route calls PDF.co endpoints. When an endpoint requires a URL, the server uploads the file to PDF.co temporary storage and retries with the returned URL.
- The route responds with secure download URLs that the UI presents in the Download section.

## Notes

- API keys are used only on the server and never exposed to the browser.
- Some from-PDF conversions may fall back to text if a specific format isn’t supported by the current provider.

# PDF Converter (Next.js)

A modern PDF converter web app for Anslation's Front End Developer Internship assignment. Supports uploading files, converting to/from PDF via PDF.co, and downloading results. Built with Next.js, TypeScript, and a clean component architecture.

## Features

- Drag-and-drop file upload with validation
- Convert to PDF and from PDF (DOCX, TXT, PNG, JPG)
- Progress and status UI with error handling
- Download converted files
- Secure server route proxying to PDF.co (no API key on client)
- Environment variables via `.env.local`

## Tech

- Next.js App Router + TypeScript
- React 19, shadcn/ui + Radix primitives
- PDF.co API

## Setup

1. Install dependencies

```powershell
pnpm install
```

2. Create `.env.local` from the example and add your key

```powershell
Copy-Item .env.local.example .env.local
# Edit .env.local and set PDF_CO_API_KEY
```

3. Run the dev server

```powershell
pnpm dev
```

Open <http://localhost:3000>

Optional: Build production

```powershell
pnpm run build; pnpm start
```

## Environment

- PDF_CO_API_KEY: Your PDF.co API key (free tier works for testing)

## API

- GET `/api/hello` → `{ message: "Hello from Next.js API!" }`
- POST `/api/convert` → body `{ files:[{name,data,type}], outputFormat, quality }`
  - Converts using PDF.co and returns `{ success, files:[{name,url,size}] }`

## Notes

- API key is only used server-side. Do not expose it on the client.
- The demo uses a limited fallback key when missing, but you should set your own.

## Deployment (Vercel recommended)

1. Push to GitHub
2. Import repo in Vercel
3. Set Environment Variable: `PDF_CO_API_KEY`
4. Deploy

## Submission Template

- Full Name:
- Email ID:
- Phone Number:
- Task Name: PDF Converter
- GitHub Link:
- Live Demo (Vercel/Netlify) or Video:

## License

For evaluation use.
