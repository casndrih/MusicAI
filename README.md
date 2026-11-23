# MusicAI — AI Music Remix Studio

A responsive AI music remix web application built with **Next.js, TypeScript, and Replicate**. Upload a track, describe a new musical direction, and generate one or two alternate arrangements with the MusicGen Remixer model.

> MusicAI is an independent project. It is inspired by the workflow and broad visual direction of modern AI music tools; it is not affiliated with MusicWave.ai.

![MusicAI](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Replicate](https://img.shields.io/badge/AI-Replicate-6B4FBB) ![License](https://img.shields.io/badge/License-Apache--2.0-green)

## Features

- **Responsive remix studio** with desktop and mobile layouts.
- **Audio upload** for MP3, WAV, and M4A files (30 MB application upload limit; 8-minute product guideline).
- **Quick Remix** with prompt presets for Lo-fi, Club, Cinematic, Drum & Bass, Afrobeats, and Synthwave.
- **Custom Remix** with optional title, lyric/vocal direction, instrumental preference, and vocal direction.
- **Duo Mix** starts two independent AI remix predictions; **Wave Mix** starts one.
- **Live job status** polling, generated audio previews, and download links.
- **Cancel prediction API** for future UI integrations.
- **Server-side Replicate credentials**; API tokens are never sent to the browser.
- **Professional landing page** with examples, feature explanations, how-it-works, FAQ, and CTA sections.

## Technology

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React, custom CSS, Lucide icons |
| AI inference | Replicate HTTP/client API |
| Remix model | [sakemin/musicgen-remixer](https://replicate.com/sakemin/musicgen-remixer) |
| Runtime | Node.js |

## Architecture

```text
Browser
  └── RemixWorkspace
       ├── POST /api/remix
       │    ├── Validate uploaded audio and prompt
       │    ├── Create one or two Replicate predictions
       │    └── Return prediction IDs
       └── GET /api/remix/:id
            └── Retrieve prediction status and output URLs

Next.js server
  └── Replicate API
       └── sakemin/musicgen-remixer
```

The Replicate token is read only by server routes. The browser uploads the selected audio to the Next.js server; the server submits it to Replicate as a model file input. Generation is asynchronous, and the client polls the prediction endpoint until it reaches a terminal state.

## Requirements

- Node.js 20.9 or newer
- npm 10+ (or a compatible package manager)
- A Replicate account and API token with available billing/usage

## Quick start

1. Clone the repository:

   ```bash
   git clone https://github.com/casndrih/MusicAI.git
   cd MusicAI
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Add your Replicate token to `.env.local`:

   ```env
   REPLICATE_API_TOKEN=r8_your_actual_token
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Create/manage tokens at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens). Keep this value private. Never prefix it with `NEXT_PUBLIC_`.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `REPLICATE_API_TOKEN` | Yes | Private Replicate API token used by server routes. |
| `REPLICATE_REMIX_MODEL` | No | Reserved model identifier override for deployments; current version is pinned in the remix route for reproducibility. |
| `NEXT_PUBLIC_APP_URL` | No | Canonical application URL used for metadata. |

## AI model and generation behavior

The integration uses the Replicate model **sakemin/musicgen-remixer**, pinned to model version:

```text
0b769f28e399c7c30e4f2360691b9b11c294183e9ab2fd9f3398127b556c86d7
```

The model accepts a source audio file and a text prompt, then returns generated audio output. Duo Mix launches two independent predictions with different prompt directions/temperatures. Wave Mix launches one prediction.

The model can take several minutes depending on input length and Replicate queue capacity. Replicate usage is billed by the provider and is not included with this repository. Check the model page for current cost and availability before enabling public usage.

**Model capability note:** the custom title, lyrics, instrumental, and vocal controls are included as prompt guidance. They do not imply that the underlying model offers dedicated lyric replacement, isolated vocal editing, or guaranteed instrumental-only controls.

## API

### `POST /api/remix`

Accepts `multipart/form-data`:

| Field | Type | Notes |
| --- | --- | --- |
| `audio` | File | MP3, WAV, or M4A; up to 30 MB |
| `prompt` | string | Required; maximum 1,200 characters |
| `mixType` | string | `duo` or `wave` |
| `mode` | string | `quick` or `custom` |
| `title` | string | Optional; maximum 100 characters |
| `lyrics` | string | Optional; maximum 3,000 characters |
| `instrumental` | string | `true` or `false` |
| `vocal` | string | Optional vocal direction |

Returns HTTP 202 with prediction IDs:

```json
{
  "predictions": [
    { "id": "prediction-id", "status": "starting" }
  ]
}
```

Duo Mix returns two prediction entries.

### `GET /api/remix/:id`

Returns the current prediction status, output, error, and timestamps. Status values are provided by Replicate (for example, `starting`, `processing`, `succeeded`, `failed`, or `canceled`).

### `DELETE /api/remix/:id`

Requests cancellation of a prediction. This endpoint is available for integrations; the current workspace does not expose a cancel control.

## Deployment

### Vercel

1. Import `casndrih/MusicAI` into Vercel.
2. Set `REPLICATE_API_TOKEN` in Project Settings → Environment Variables.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. Deploy using the Next.js preset.

The remix API uses the Node.js runtime. Ensure your host permits request bodies large enough for the configured 30 MB upload limit and supports a sufficiently long serverless function duration. The route currently declares a 60-second function maximum for prediction creation; model generation continues asynchronously and is polled separately.

### Other Node.js hosts

```bash
npm ci
npm run build
npm start
```

Set the same environment variables in your hosting provider. Do not commit `.env.local`.

## Production hardening checklist

This repository provides the core end-to-end generation flow. Before opening it to public users, add:

- Authentication and per-user authorization.
- Durable database records for jobs and ownership.
- Rate limiting and abuse prevention on create/status routes.
- Object storage for source audio and generated outputs.
- Replicate webhook signature verification and durable output ingestion.
- Usage metering, quotas, and payment/credit accounting.
- Content moderation, copyright reporting, and a clear upload retention policy.
- A background queue for retries and long-running workflows.

Replicate prediction files are temporary and may be deleted after a short retention period. Download outputs you need to retain or add a storage/webhook layer before production use.

## Testing

```bash
npm run lint
npm run build
```

For a real generation smoke test, configure a valid Replicate token, upload audio you have rights to use, and submit a short prompt. A missing token is reported as a configuration error by the API.

## Responsible use

Only upload audio that you own or are authorized to process. Respect copyright, performer rights, and applicable laws when distributing generated remixes. AI output may not be suitable for commercial use; review the model's license and terms before commercial deployment.

## License

This repository is distributed under the Apache License 2.0. See [LICENSE](./LICENSE). The third-party model and its weights are subject to their own licenses and terms; see the [Replicate model page](https://replicate.com/sakemin/musicgen-remixer) for details.

---

Made with care by [casndrih](https://github.com/casndrih).
