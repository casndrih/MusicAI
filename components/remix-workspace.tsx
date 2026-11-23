"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AudioLines, Check, CircleAlert, Download, LoaderCircle, Music2, Pause, Play, Search, ShieldCheck, Upload } from "lucide-react";

const MODEL_URL = "https://huggingface.co/StemSplitio/htdemucs-onnx/resolve/main/htdemucs_fp16weights.onnx";
const MODEL_SIZE = "166 MB";
const SAMPLE_RATE = 44100;
const SEGMENT = 343980;
const OVERLAP = Math.floor(SEGMENT / 4);
const STRIDE = SEGMENT - OVERLAP;
const MAX_SECONDS = 180;
const ACOUSTID_CLIENT_KEY = "wiWMaMKtTR";

type Stem = { name: string; url: string; size: number };

function encodeWav(planar: Float32Array[], frames: number, rate: number) {
  const channels = planar.length;
  const bytes = new ArrayBuffer(44 + frames * channels * 2);
  const view = new DataView(bytes);
  const tag = (at: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
  tag(0, "RIFF"); view.setUint32(4, 36 + frames * channels * 2, true); tag(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); tag(36, "data");
  view.setUint32(40, frames * channels * 2, true);
  let offset = 44;
  for (let i = 0; i < frames; i++) for (let c = 0; c < channels; c++) {
    view.setInt16(offset, Math.round(Math.max(-1, Math.min(1, planar[c][i])) * 32767), true);
    offset += 2;
  }
  return bytes;
}

function makeWindow() {
  const window = new Float32Array(SEGMENT).fill(1);
  for (let i = 0; i < OVERLAP; i++) {
    const ramp = i / OVERLAP;
    window[i] = ramp;
    window[SEGMENT - 1 - i] = ramp;
  }
  return window;
}

export default function RemixWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [tab, setTab] = useState<"separate" | "identify" | "youtube">("separate");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideo, setYoutubeVideo] = useState<{ id: string; title: string; author: string; thumbnail: string } | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotifyPreview, setSpotifyPreview] = useState<{ embedUrl: string; title: string; thumbnail: string; type: string } | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState("");
  const [converting, setConverting] = useState(false);
  const [status, setStatus] = useState("Choose an audio file to begin.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stems, setStems] = useState<Stem[]>([]);
  const [query, setQuery] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [identifyStatus, setIdentifyStatus] = useState("");
  const [identifyError, setIdentifyError] = useState("");
  const [identifyResult, setIdentifyResult] = useState<{ title: string; artist: string; album: string; score: number; recordingId?: string } | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modelRef = useRef<import("onnxruntime-web").InferenceSession | null>(null);

  useEffect(() => () => {
    stems.forEach((stem) => URL.revokeObjectURL(stem.url));
    audioRef.current?.pause();
  }, [stems]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    setError(""); setStems([]); setProgress(0);
    if (!next) return;
    if (!next.type.startsWith("audio/") && !/\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(next.name)) {
      setError("Choose a supported audio file (MP3, WAV, M4A, AAC, FLAC or OGG)."); return;
    }
    if (next.size > 40 * 1024 * 1024) { setError("Choose a file smaller than 40 MB."); return; }
    setFile(next); setStatus("Ready to process locally.");
  };

  const separate = async () => {
    if (!file) { setError("Choose an audio file first."); return; }
    setBusy(true); setError(""); setStems([]); setProgress(0);
    let context: AudioContext | null = null;
    try {
      setStatus("Loading the local AI engine. First download is about " + MODEL_SIZE + ".");
      const hasGpu = Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
      let ort = hasGpu ? await import("onnxruntime-web/webgpu") : await import("onnxruntime-web");
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
      if (!modelRef.current) {
        try {
          modelRef.current = await ort.InferenceSession.create(MODEL_URL, {
            executionProviders: [hasGpu ? "webgpu" : "wasm"],
            graphOptimizationLevel: "all"
          });
        } catch (gpuError) {
          if (!hasGpu) throw gpuError;
          setStatus("WebGPU is unavailable on this device. Switching to browser CPU processing…");
          ort = await import("onnxruntime-web");
          ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
          modelRef.current = await ort.InferenceSession.create(MODEL_URL, {
            executionProviders: ["wasm"],
            graphOptimizationLevel: "all"
          });
        }
      }
      const session = modelRef.current;
      if (!session) throw new Error("The local AI model could not be initialized.");
      setStatus("Decoding audio on this device…");
      context = new AudioContext({ sampleRate: SAMPLE_RATE });
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      const frames = decoded.length;
      const seconds = frames / SAMPLE_RATE;
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
      const deviceLimit = deviceMemory <= 4 ? 60 : deviceMemory <= 8 ? 120 : MAX_SECONDS;
      if (seconds > deviceLimit) throw new Error("This device is limited to " + Math.round(deviceLimit / 60) + " minute(s) per separation to protect memory. Trim the track and try again.");
      if (decoded.numberOfChannels < 1) throw new Error("The selected file has no audio channels.");
      const mix = [new Float32Array(frames), new Float32Array(frames)];
      for (let c = 0; c < 2; c++) mix[c].set(decoded.getChannelData(Math.min(c, decoded.numberOfChannels - 1)));
      const output = Array.from({ length: 4 }, () => [new Float32Array(frames), new Float32Array(frames)]);
      const weights = new Float32Array(frames);
      const window = makeWindow();
      const chunks = Math.ceil(frames / STRIDE);
      const chunkBuffer = new Float32Array(2 * SEGMENT);
      setStatus("Separating vocals, drums, bass and instruments locally…");
      for (let index = 0; index < chunks; index++) {
        const start = index * STRIDE;
        const end = Math.min(start + SEGMENT, frames);
        const length = end - start;
        chunkBuffer.fill(0);
        chunkBuffer.set(mix[0].subarray(start, end), 0);
        chunkBuffer.set(mix[1].subarray(start, end), SEGMENT);
        const result = await session.run({
          mix: new ort.Tensor("float32", chunkBuffer, [1, 2, SEGMENT])
        });
        const data = result.stems.data as Float32Array;
        for (let source = 0; source < 4; source++) {
          const base = source * 2 * SEGMENT;
          for (let c = 0; c < 2; c++) {
            const target = output[source][c];
            const sourceOffset = base + c * SEGMENT;
            for (let i = 0; i < length; i++) target[start + i] += data[sourceOffset + i] * window[i];
          }
        }
        for (let i = 0; i < length; i++) weights[start + i] += window[i];
        setProgress(Math.round(((index + 1) / chunks) * 100));
      }
      for (let source = 0; source < 4; source++) for (let c = 0; c < 2; c++) {
        for (let i = 0; i < frames; i++) output[source][c][i] /= Math.max(weights[i], 1e-8);
      }
      const vocals = output[3];
      const instrumental = [new Float32Array(frames), new Float32Array(frames)];
      for (let c = 0; c < 2; c++) for (let i = 0; i < frames; i++) instrumental[c][i] = mix[c][i] - vocals[c][i];
      const names = ["Drums", "Bass", "Other instruments", "Vocals"];
      const nextStems = output.map((channels, index) => ({
        name: names[index], size: frames * 4 * 2,
        url: URL.createObjectURL(new Blob([encodeWav(channels, frames, SAMPLE_RATE)], { type: "audio/wav" }))
      }));
      nextStems.push({
        name: "Instrumental (no vocals)", size: frames * 4 * 2,
        url: URL.createObjectURL(new Blob([encodeWav(instrumental, frames, SAMPLE_RATE)], { type: "audio/wav" }))
      });
      setStems(nextStems);
      setStatus("Separation complete. Your audio stayed on this device.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Local separation failed. Try another browser or a shorter audio file.");
      setStatus("Separation could not be completed.");
    } finally {
      await context?.close().catch(() => undefined);
      setBusy(false);
    }
  };

  const identifyTrack = async () => {
    if (!file) { setIdentifyError("Choose an audio file first."); return; }
    setIdentifying(true); setIdentifyError(""); setIdentifyResult(null);
    let context: AudioContext | null = null;
    try {
      setIdentifyStatus("Decoding the complete recording locally…");
      context = new AudioContext();
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      const sampleRate = decoded.sampleRate;
      const duration = decoded.duration;
      if (duration < 8) throw new Error("Choose a clip at least 8 seconds long for a reliable match.");
      const channels = Math.min(decoded.numberOfChannels, 2);
      if (channels < 1) throw new Error("The selected file has no audio channels.");

      setIdentifyStatus("Generating a full-track Chromaprint fingerprint in your browser…");
      const chroma = await import("rusty-chromaprint-wasm");
      const fingerprinter = new chroma.Fingerprinter();
      fingerprinter.start(sampleRate, channels);
      const left = decoded.getChannelData(0);
      const right = channels > 1 ? decoded.getChannelData(1) : left;
      const chunkFrames = 16384;
      for (let offset = 0; offset < decoded.length; offset += chunkFrames) {
        const count = Math.min(chunkFrames, decoded.length - offset);
        const samples = new Int16Array(count * channels);
        for (let i = 0; i < count; i++) {
          samples[i * channels] = Math.max(-32768, Math.min(32767, Math.round(left[offset + i] * 32768)));
          if (channels > 1) samples[i * channels + 1] = Math.max(-32768, Math.min(32767, Math.round(right[offset + i] * 32768)));
        }
        fingerprinter.consume(samples);
      }
      fingerprinter.finish();
      const fingerprint = fingerprinter.getCompressedFingerprint();
      if (!fingerprint) throw new Error("Could not generate an audio fingerprint from this file.");

      setIdentifyStatus("Checking the AcoustID music catalogue…");
      const body = new URLSearchParams({
        client: ACOUSTID_CLIENT_KEY,
        duration: String(Math.round(duration)),
        fingerprint,
        meta: "recordings+releasegroups",
        format: "json"
      });
      const response = await fetch("https://api.acoustid.org/v2/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      if (!response.ok) throw new Error("AcoustID lookup failed (HTTP " + response.status + "). Check the application key or try again.");
      const payload = await response.json() as {
        status?: string;
        error?: { message?: string };
        results?: Array<{
          score?: number;
          recordings?: Array<{
            id?: string;
            title?: string;
            artists?: Array<{ name?: string }>;
            releasegroups?: Array<{ title?: string }>;
          }>;
        }>;
      };
      if (payload.status !== "ok") throw new Error(payload.error?.message || "The music catalogue could not complete this lookup.");
      const matches = (payload.results || [])
        .flatMap((item) => (item.recordings || []).map((recording) => ({ recording, score: item.score || 0 })))
        .sort((a, b) => b.score - a.score);
      const match = matches[0];
      if (!match?.recording?.title) {
        setIdentifyStatus("AcoustID received the fingerprint but found no catalogue match. Try a clean 10–30 second section with minimal speech, crowd noise or remix effects. Some tracks are not in its database.");
        return;
      }
      setIdentifyResult({
        title: match.recording.title,
        artist: (match.recording.artists || []).map((artist) => artist.name).filter(Boolean).join(", ") || "Unknown artist",
        album: match.recording.releasegroups?.[0]?.title || "Album not listed",
        score: match.score,
        recordingId: match.recording.id
      });
      setIdentifyStatus("A possible match was found. Check the title and artist before opening a platform.");
    } catch (cause) {
      setIdentifyError(cause instanceof Error ? cause.message : "Audio recognition failed. Try another file.");
      setIdentifyStatus("");
    } finally {
      await context?.close().catch(() => undefined);
      setIdentifying(false);
    }
  };

  const loadYoutubePreview = async () => {
    setYoutubeError(""); setYoutubeVideo(null);
    const raw = youtubeUrl.trim();
    const match = raw.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) || ( /^[A-Za-z0-9_-]{11}$/.test(raw) ? [raw, raw] : null);
    if (!match) { setYoutubeError("Paste a valid YouTube video link or 11-character video ID."); return; }
    const id = match[1];
    setYoutubeLoading(true);
    try {
      const response = await fetch("https://www.youtube.com/oembed?url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id) + "&format=json");
      if (!response.ok) throw new Error("YouTube could not provide preview details for this video. It may be private, restricted or unavailable.");
      const info = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
      setYoutubeVideo({ id, title: info.title || "YouTube video", author: info.author_name || "YouTube creator", thumbnail: info.thumbnail_url || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" });
    } catch (cause) {
      setYoutubeError(cause instanceof Error ? cause.message : "Could not load YouTube preview details.");
    } finally {
      setYoutubeLoading(false);
    }
  };

  const loadSpotifyPreview = async () => {
    setSpotifyError(""); setSpotifyPreview(null);
    let parsed: URL;
    try { parsed = new URL(spotifyUrl.trim()); } catch { setSpotifyError("Paste a valid Spotify track, album, playlist, episode or show link."); return; }
    if (!/(^|\.)spotify\.com$/.test(parsed.hostname)) { setSpotifyError("Only open.spotify.com links are supported."); return; }
    const match = parsed.pathname.match(/^\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)\/?$/);
    if (!match) { setSpotifyError("This Spotify link type is not supported. Paste a track, album, playlist, episode or show URL."); return; }
    const type = match[1];
    const canonical = "https://open.spotify.com/" + type + "/" + match[2];
    setSpotifyLoading(true);
    try {
      const response = await fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent(canonical));
      if (!response.ok) throw new Error("Spotify could not provide preview information for this link.");
      const info = await response.json() as { title?: string; thumbnail_url?: string };
      setSpotifyPreview({
        embedUrl: "https://open.spotify.com/embed/" + type + "/" + match[2] + "?utm_source=generator",
        title: info.title || (type.charAt(0).toUpperCase() + type.slice(1)),
        thumbnail: info.thumbnail_url || "",
        type
      });
    } catch (cause) {
      setSpotifyError(cause instanceof Error ? cause.message : "Could not load Spotify preview.");
    } finally {
      setSpotifyLoading(false);
    }
  };

  const convertUploadToWav = async () => {
    if (!file) { setYoutubeError("Choose an audio file first in the Vocal remover tab."); return; }
    setConverting(true); setYoutubeError("");
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      const channels = Array.from({ length: Math.min(decoded.numberOfChannels, 2) }, (_, index) => new Float32Array(decoded.getChannelData(index)));
      const wav = encodeWav(channels, decoded.length, decoded.sampleRate);
      const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name.replace(/\.[^.]+$/, "") + ".wav";
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setYoutubeError(cause instanceof Error ? cause.message : "Could not convert this audio file.");
    } finally {
      await context?.close().catch(() => undefined);
      setConverting(false);
    }
  };

  const playStem = (stem: Stem) => {
    if (playing === stem.name) { audioRef.current?.pause(); setPlaying(null); return; }
    audioRef.current?.pause();
    const audio = new Audio(stem.url);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => { setPlaying(null); setError("Could not play this preview."); };
    audioRef.current = audio; setPlaying(stem.name); void audio.play();
  };

  const encoded = encodeURIComponent(query.trim());
  const sourceLinks = [
    { name: "YouTube", url: "https://www.youtube.com/results?search_query=" + encoded },
    { name: "Spotify", url: "https://open.spotify.com/search/" + encoded },
    { name: "SoundCloud", url: "https://soundcloud.com/search?q=" + encoded },
    { name: "Apple Music", url: "https://music.apple.com/search?term=" + encoded },
    { name: "Bandcamp", url: "https://bandcamp.com/search?q=" + encoded }
  ];

  return <div className="studio-shell local-studio">
    <div className="studio-topline">
      <div className="studio-title"><span className="studio-icon"><AudioLines size={18}/></span><div><b>MUSICAI TOOLS</b><small>LOCAL AUDIO WORKSPACE</small></div></div>
      <span className="studio-secure"><ShieldCheck size={14}/> AUDIO STAYS ON YOUR DEVICE</span>
    </div>
    <div className="local-tabs">
      <button className={tab === "separate" ? "active" : ""} onClick={() => setTab("separate")}><AudioLines size={16}/> Vocal remover</button>
      <button className={tab === "identify" ? "active" : ""} onClick={() => setTab("identify")}><Search size={16}/> Music identification</button>
      <button className={tab === "youtube" ? "active" : ""} onClick={() => setTab("youtube")}><Play size={16}/> YouTube & convert</button>
    </div>
    {tab === "separate" ? <div className="local-tool-panel">
      <div className="local-intro"><span className="local-kicker">01 / SOURCE SEPARATION</span><h3>Take the vocals out.<br/><em>Keep the music.</em></h3><p>Demucs AI separates your track into vocals, drums, bass and other instruments. Processing runs in your browser with WebGPU or CPU fallback.</p></div>
      <div className="local-upload" onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}>
        <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg" onChange={chooseFile} hidden/>
        <span className="upload-icon"><Upload size={22}/></span><b>{file ? file.name : "Choose an audio track"}</b>
        <span>{file ? (file.size / 1024 / 1024).toFixed(1) + " MB · Ready for local processing" : "MP3, WAV, M4A, AAC, FLAC or OGG · Up to 40 MB"}</span>
        <small>Your original audio is never uploaded to MusicAI.</small>
      </div>
      <button className="generate-button" onClick={separate} disabled={busy || !file}>{busy ? <><LoaderCircle className="spin" size={18}/> Processing on this device…</> : <><AudioLines size={18}/> Separate vocals & instruments <span>↗</span></>}</button>
      {busy && <div className="local-progress"><div><span>{status}</span><b>{progress}%</b></div><div className="progress-track"><i style={{ width: progress + "%" }}/></div></div>}
      {!busy && <p className="local-status"><ShieldCheck size={14}/> {status}</p>}
      <div className="local-model-note"><b>First-time setup:</b> the browser downloads the approximately 166 MB open model once. It is cached by your browser. Processing speed and memory use depend on your device; WebGPU is preferred when available.</div>
      {stems.length > 0 && <div className="local-results"><div className="results-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> SEPARATED STEMS</span><h3>Your tracks are ready.</h3></div><span className="job-status succeeded"><Check size={15}/></span></div>
        <div className="local-stem-list">{stems.map((stem) => <div className="local-stem" key={stem.name}><span className="file-icon"><Music2 size={18}/></span><div><b>{stem.name}</b><small>WAV · {(stem.size / 1024 / 1024).toFixed(1)} MB</small></div><button className="icon-button" onClick={() => playStem(stem)} aria-label={"Play " + stem.name}>{playing === stem.name ? <Pause size={16}/> : <Play size={16}/>}</button><a className="stem-download" href={stem.url} download={stem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".wav"}><Download size={15}/> Save</a></div>)}</div>
      </div>}
      {error && <div className="error-message"><CircleAlert size={17}/>{error}</div>}
    </div> : <div className="local-tool-panel finder-panel">
      <div className="local-intro"><span className="local-kicker">02 / MUSIC DISCOVERY</span><h3>Recognise the track.<br/><em>Find its sources.</em></h3><p>Upload a short recording to create a Chromaprint fingerprint in your browser and search the AcoustID music catalogue. No audio file is uploaded.</p></div>
      <label className="field-label" htmlFor="identify-audio">AUDIO CLIP FOR RECOGNITION</label>
      <input id="identify-audio" className="text-input" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg" onChange={chooseFile}/>
      {file && <p className="local-status"><ShieldCheck size={14}/> Selected: {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
      <button className="generate-button" onClick={identifyTrack} disabled={identifying || !file}>{identifying ? <><LoaderCircle className="spin" size={18}/> Identifying on this device…</> : <><Search size={18}/> Identify this recording <span>↗</span></>}</button>
      {identifyStatus && <p className="local-status">{identifyStatus}</p>}
      {identifyError && <div className="error-message"><CircleAlert size={17}/>{identifyError}</div>}
      {identifyResult && <div className="identify-result"><span className="local-kicker">POSSIBLE MATCH · {(identifyResult.score * 100).toFixed(0)}% CATALOGUE SCORE</span><h3>{identifyResult.title}</h3><p>{identifyResult.artist}</p><small>{identifyResult.album}</small><div className="source-link-grid">{[
        { name: "YouTube", url: "https://www.youtube.com/results?search_query=" },
        { name: "Spotify", url: "https://open.spotify.com/search/" },
        { name: "SoundCloud", url: "https://soundcloud.com/search?q=" },
        { name: "Apple Music", url: "https://music.apple.com/search?term=" },
        { name: "Bandcamp", url: "https://bandcamp.com/search?q=" }
      ].map((source) => <a key={source.name} href={source.url + encodeURIComponent(identifyResult.title + " " + identifyResult.artist)} target="_blank" rel="noreferrer"><span>{source.name}</span><span>Open result ↗</span></a>)}</div>{identifyResult.recordingId && <a className="stem-download" href={"https://musicbrainz.org/recording/" + identifyResult.recordingId} target="_blank" rel="noreferrer">View MusicBrainz recording ↗</a>}</div>}
      <div className="local-model-note"><b>Recognition notes:</b> Chromaprint generates a compact audio fingerprint locally; only that fingerprint, clip duration and your AcoustID application key are sent to AcoustID for catalogue matching. Results depend on AcoustID coverage and may not identify obscure, live or unreleased recordings. Register an application key at https://acoustid.org/new-application and respect AcoustID’s non-commercial usage and rate limits.</div>
      <label className="field-label" htmlFor="music-query">OR SEARCH BY SONG TITLE, ARTIST OR PHRASE</label>
      <div className="finder-input-row"><input id="music-query" className="text-input" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) window.open(sourceLinks[0].url, "_blank", "noopener,noreferrer"); }} placeholder="e.g. song title and artist"/><button className="generate-button" disabled={!query.trim()} onClick={() => window.open(sourceLinks[0].url, "_blank", "noopener,noreferrer")}><Search size={17}/> Search</button></div>
      <div className="source-link-grid">{sourceLinks.map((source) => <a key={source.name} href={query.trim() ? source.url : undefined} target="_blank" rel="noreferrer" aria-disabled={!query.trim()} onClick={(e) => { if (!query.trim()) e.preventDefault(); }}><span>{source.name}</span><span>Open results ↗</span></a>)}</div>
      <div className="local-model-note"><b>Identification note:</b> automatic recognition uses the AcoustID catalogue. MusicAI links to matching searches on music platforms but does not download or rehost tracks.</div>
    </div> : <div className="local-tool-panel youtube-panel">
      <div className="local-intro"><span className="local-kicker">03 / VIDEO PREVIEW & AUDIO CONVERSION</span><h3>Preview the video.<br/><em>Explore the details.</em></h3><p>Paste a YouTube link to view its embedded player, thumbnail and available title/channel details. Album and release details appear when a recording is identified through MusicAI.</p></div>
      <label className="field-label" htmlFor="youtube-url">YOUTUBE VIDEO URL OR ID</label>
      <div className="finder-input-row"><input id="youtube-url" className="text-input" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadYoutubePreview(); }} placeholder="https://www.youtube.com/watch?v=..."/><button className="generate-button" onClick={loadYoutubePreview} disabled={youtubeLoading || !youtubeUrl.trim()}>{youtubeLoading ? <><LoaderCircle className="spin" size={17}/> Loading…</> : <><Search size={17}/> Preview</>}</button></div>
      {youtubeError && <div className="error-message"><CircleAlert size={17}/>{youtubeError}</div>}
      {youtubeVideo && <div className="youtube-preview">
        <div className="youtube-player"><iframe src={"https://www.youtube-nocookie.com/embed/" + youtubeVideo.id} title={youtubeVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>
        <div className="youtube-details"><img src={youtubeVideo.thumbnail} alt="Video thumbnail"/><div><span className="local-kicker">YOUTUBE VIDEO DETAILS</span><h3>{youtubeVideo.title}</h3><p>{youtubeVideo.author}</p><a className="stem-download" href={"https://www.youtube.com/watch?v=" + youtubeVideo.id} target="_blank" rel="noreferrer">Open on YouTube ↗</a></div></div>
      </div>}
      <div className="spotify-preview-section">
        <span className="local-kicker">SPOTIFY TRACK & ALBUM PREVIEW</span>
        <h3>Open a Spotify preview.</h3>
        <p>Paste a Spotify track, album, playlist or podcast link to load its official embedded player and available artwork.</p>
        <div className="finder-input-row"><input className="text-input" aria-label="Spotify URL" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadSpotifyPreview(); }} placeholder="https://open.spotify.com/track/..."/><button className="generate-button" onClick={loadSpotifyPreview} disabled={spotifyLoading || !spotifyUrl.trim()}>{spotifyLoading ? <><LoaderCircle className="spin" size={17}/> Loading…</> : <><Search size={17}/> Preview Spotify</>}</button></div>
        {spotifyError && <div className="error-message"><CircleAlert size={17}/>{spotifyError}</div>}
        {spotifyPreview && <div className="spotify-preview-card">
          {spotifyPreview.thumbnail && <img src={spotifyPreview.thumbnail} alt={spotifyPreview.title + " artwork"}/>}
          <div className="spotify-preview-copy"><span className="local-kicker">{spotifyPreview.type.toUpperCase()} · SPOTIFY</span><h3>{spotifyPreview.title}</h3><a className="stem-download" href={spotifyUrl.trim()} target="_blank" rel="noreferrer">Open in Spotify ↗</a></div>
          <iframe src={spotifyPreview.embedUrl} title={"Spotify " + spotifyPreview.type + " preview"} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/>
        </div>}
        <div className="local-model-note"><b>Spotify downloads:</b> Spotify's player and catalogue preview are supported, but MusicAI cannot extract or download protected Spotify streams. Use Spotify's official offline-download feature where your subscription and region support it, or convert audio files you own using the local converter.</div>
      </div>
      <div className="local-model-note"><b>About downloads:</b> MusicAI does not rip or extract audio from YouTube. You can preview videos here and use the converter below for audio files you own or are authorized to process.</div>
      <div className="youtube-convert-card"><div><span className="local-kicker">LOCAL FILE CONVERTER</span><h3>Convert an audio file to WAV.</h3><p>{file ? "Selected file: " + file.name : "Choose an audio file in the Vocal remover tab first."} Conversion happens in your browser; no upload to MusicAI.</p></div><button className="generate-button" onClick={convertUploadToWav} disabled={!file || converting}>{converting ? <><LoaderCircle className="spin" size={17}/> Converting…</> : <><Download size={17}/> Convert & download WAV</>}</button></div>
      <div className="local-model-note"><b>Album and release information:</b> identify a recording in the Music Identification tab to see catalogue album information and links to YouTube, Spotify, SoundCloud, Apple Music and Bandcamp. YouTube's video metadata does not reliably include an official album or track release.</div>
    </div>}
  </div>;
}
