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
  const [tab, setTab] = useState<"separate" | "identify">("separate");
  const [status, setStatus] = useState("Choose an audio file to begin.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stems, setStems] = useState<Stem[]>([]);
  const [query, setQuery] = useState("");
  const [acoustIdKey, setAcoustIdKey] = useState(process.env.NEXT_PUBLIC_ACOUSTID_CLIENT_KEY || "");
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
    if (!acoustIdKey.trim()) { setIdentifyError("Enter your AcoustID application key to enable recognition."); return; }
    setIdentifying(true); setIdentifyError(""); setIdentifyResult(null);
    let context: AudioContext | null = null;
    try {
      setIdentifyStatus("Decoding audio locally…");
      context = new AudioContext({ sampleRate: 44100 });
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      const sampleRate = decoded.sampleRate;
      const duration = Math.min(decoded.duration, 120);
      const frames = Math.floor(duration * sampleRate);
      if (duration < 8) throw new Error("Choose a clip at least 8 seconds long for a reliable match.");
      setIdentifyStatus("Generating a Chromaprint fingerprint in your browser…");
      const left = decoded.getChannelData(0);
      const right = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : left;
      const interleaved = new Int16Array(frames * 2);
      for (let i = 0; i < frames; i++) {
        interleaved[i * 2] = Math.max(-32768, Math.min(32767, Math.round(left[i] * 32767)));
        interleaved[i * 2 + 1] = Math.max(-32768, Math.min(32767, Math.round(right[i] * 32767)));
      }
      const chroma = await import("rusty-chromaprint-wasm");
      const fingerprint = chroma.fingerprintFromSamples(sampleRate, 2, interleaved);
      if (!fingerprint.compressed) throw new Error("Could not generate an audio fingerprint from this file.");
      setIdentifyStatus("Checking the AcoustID music catalogue…");
      const body = new URLSearchParams({
        client: acoustIdKey.trim(),
        duration: String(Math.round(duration)),
        fingerprint: fingerprint.compressed,
        meta: "recordings+releasegroups+compress",
        format: "json"
      });
      const response = await fetch("https://api.acoustid.org/v2/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      if (!response.ok) throw new Error("AcoustID lookup failed (HTTP " + response.status + "). Check your key or try again.");
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
        setIdentifyStatus("No catalogue match found. Try a clearer or longer section of the original recording.");
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
      <button className={tab === "separate" ? "active" : ""} onClick={() => setTab("separate")}><AudioLines size={16}/> Vocal remover & stems</button>
      <button className={tab === "identify" ? "active" : ""} onClick={() => setTab("identify")}><Search size={16}/> Music source finder</button>
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
      <label className="field-label" htmlFor="acoustid-key">ACOUSTID APPLICATION KEY</label>
      <input id="acoustid-key" className="text-input" value={acoustIdKey} onChange={(e) => setAcoustIdKey(e.target.value)} placeholder="Paste your AcoustID client key"/>
      <p className="local-status">Your key is used only in this browser session and is not saved by MusicAI.</p>
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
      <div className="local-model-note"><b>Identification note:</b> this finder searches the platforms using the title, artist or phrase you provide. Automatic recognition from an unknown audio recording is not enabled yet; that requires a dedicated fingerprint catalogue and its own service/API access. MusicAI does not download or rehost tracks from these platforms.</div>
    </div>}
  </div>;
}
