# MusicAI — Local AI Audio Studio

MusicAI is an independent browser-based audio workspace built with Next.js, TypeScript, ONNX Runtime Web and the open Demucs source-separation model.

**Core audio separation runs locally in the visitor's browser.** MusicAI does not upload source audio to its server and does not require Replicate, a paid AI inference API, or an application API token.

> MusicAI is an independent project by [Casper Ndrih (@casndrih)](https://github.com/casndrih). It is not affiliated with YouTube, Spotify, SoundCloud, Apple Music, Bandcamp, Meta or StemSplit.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![ONNX Runtime Web](https://img.shields.io/badge/AI-ONNX%20Runtime%20Web-7652d5) ![Demucs](https://img.shields.io/badge/Separation-Demucs-8b6bd0)

## Live preview

**[Open the MusicAI studio](https://music-ai-casndrih.vercel.app/#remixer)**

## Features

- **Vocal removal:** separates the vocal stem from the backing track.
- **Instrumental maker:** creates an instrumental mix by subtracting the separated vocal stem from the original mix.
- **Four-stem separation:** extracts drums, bass, other instruments and vocals.
- **Local inference:** runs the Demucs ONNX model in the browser using WebGPU when available, with WebAssembly fallback.
- **Local audio handling:** source audio is decoded, processed and exported in the browser. It is not sent to a MusicAI API.
- **WAV downloads:** preview and save each generated stem.
- **Music Source Finder:** opens search results on YouTube, Spotify, SoundCloud, Apple Music and Bandcamp using a title, artist or phrase supplied by the user.
- **Responsive interface:** existing MusicAI purple branding and automatic light/dark theme are retained.

## Important capability notes

- The Music Source Finder is a **catalogue search shortcut**, not automatic recognition of an unknown recording. Audio fingerprint identification is not implemented in this version.
- Platform links open the respective services. MusicAI does not scrape, download or rehost their tracks.
- Separation is limited to **40 MB and 3 minutes** per file in this first browser implementation.
- Source separation is compute- and memory-intensive. A modern desktop browser or newer mobile device is recommended. WebGPU is preferred; CPU/WebAssembly is the fallback.
- The first use downloads an approximately **166 MB** ONNX model. The model is served from the public Hugging Face model repository and cached by the browser. The ONNX Runtime WebAssembly runtime is served from jsDelivr. Internet access is therefore needed for the initial asset downloads; subsequent use may benefit from browser caching.
- Model output quality depends on the source audio and the model. Separation artifacts are possible.

## Technology

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React, custom CSS, Lucide |
| Inference runtime | ONNX Runtime Web |
| Source separation | HT-Demucs ONNX, four-stem model |
| Browser acceleration | WebGPU, WebAssembly fallback |
| Audio decode | Web Audio API |
| Audio export | Browser-generated PCM WAV |

## How local separation works

1. The browser downloads the ONNX model on first use.
2. The selected audio file is decoded locally to 44.1 kHz stereo.
3. The model processes overlapping 7.8-second audio segments.
4. MusicAI joins the segments and reconstructs the four stems.
5. The instrumental version is created by subtracting the vocal stem from the original mix.
6. WAV files are created as browser Blob URLs and downloaded directly by the user.

```text
User's browser
  ├── Select local audio file
  ├── Web Audio API decode
  ├── ONNX Runtime Web
  │    ├── WebGPU (when available)
  │    └── WebAssembly fallback
  ├── HT-Demucs ONNX model
  │    └── drums / bass / other / vocals
  ├── Build instrumental mix
  └── Preview and download WAV files

MusicAI Next.js server
  └── Serves the web application only
      (no audio upload or inference API)
```

## Requirements

- Node.js 20.9 or newer
- npm 10+
- A modern browser with Web Audio API
- WebGPU support recommended; WebAssembly is used as a fallback
- Internet access for the initial model and runtime downloads

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

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

No Replicate token or other AI API key is required.

## Deployment

Deploy the repository as a Next.js application on Vercel or another Next.js host.

The application sets the following cross-origin isolation headers to support browser audio processing and multi-threaded WebAssembly where supported:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

The model is currently loaded from Hugging Face and ONNX Runtime WebAssembly assets are loaded from jsDelivr. If you want to eliminate those asset-host dependencies as well, mirror the model and runtime files to infrastructure you control and update the asset URLs. The model is large, so check your hosting provider's static-file and bandwidth limits before bundling it into a deployment.

## Music source finder

The Music Source Finder creates direct catalogue search links for:

- YouTube
- Spotify
- SoundCloud
- Apple Music
- Bandcamp

It uses the search phrase entered by the visitor. It does not currently fingerprint uploaded audio or claim an automatic match. Search links take the visitor to the platform, where that platform controls its own catalogue, availability and results.

## Privacy

- Source audio is processed in the browser.
- MusicAI does not expose an audio upload or inference API.
- Generated WAV files are held as temporary browser Blob URLs.
- Closing or refreshing the page clears the current in-memory results.
- The model and runtime binaries are fetched from their configured public asset hosts.

## Model and attribution

The separation model is the HT-Demucs ONNX export published by [StemSplitio](https://huggingface.co/StemSplitio/htdemucs-onnx), based on Meta's [Demucs](https://github.com/facebookresearch/demucs) project.

- Model repository: [StemSplitio/htdemucs-onnx](https://huggingface.co/StemSplitio/htdemucs-onnx)
- ONNX browser runtime: [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)
- Separation implementation reference: [demucs-onnx](https://github.com/StemSplit/demucs-onnx)
- Original model paper: [Hybrid Transformers for Music Source Separation](https://arxiv.org/abs/2211.08553)

Review the model and upstream project licenses and training-data notes before commercial use. Third-party assets remain subject to their own licenses and terms.

## Development checks

```bash
npm run lint
npm run build
```

## Responsible use

Only process audio you own or are authorized to use. Respect copyright, performer rights, platform terms and applicable laws. MusicAI provides tools; it does not grant rights to source recordings or separated stems.

---

Made independently by [Casper Ndrih (@casndrih)](https://github.com/casndrih).
