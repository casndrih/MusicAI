"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { AudioLines, Check, ChevronDown, CircleAlert, Download, FileAudio, LoaderCircle, Music2, Pause, Play, Plus, RefreshCw, Sparkles, Upload, X } from "lucide-react";

type Job = { id: string; status: string; output?: unknown; error?: string; logs?: string };
type Track = { name: string; size: number; file: File; url: string };
type ResultTrack = { url: string; label: string };

const presets = [
  { name: "Lo-fi", prompt: "Warm lo-fi chillhop, dusty vinyl texture, mellow electric piano, relaxed boom-bap drums, soft bass, intimate late-night atmosphere." },
  { name: "Club", prompt: "High-energy melodic house, punchy four-on-the-floor kick, deep rolling bass, bright synth hooks, uplifting club energy." },
  { name: "Cinematic", prompt: "Epic cinematic electronic score, atmospheric pads, emotional strings, huge percussion, evolving tension and a powerful wide-screen build." },
  { name: "Drum & bass", prompt: "Energetic liquid drum and bass, rolling breakbeats, deep sub bass, lush atmospheric synths, fast flowing rhythmic momentum." },
  { name: "Afrobeats", prompt: "Modern Afrobeats groove, syncopated percussion, warm melodic guitar, deep rounded bass, bright rhythmic layers and joyful energy." },
  { name: "Synthwave", prompt: "Dreamy retro synthwave, analog arpeggios, gated drums, lush pads, neon-night atmosphere and nostalgic 1980s electronic production." }
];

function outputUrls(output: unknown): string[] {
  if (!output) return [];
  const items = Array.isArray(output) ? output : [output];
  return items.flatMap((item) => {
    if (typeof item === "string" && item.startsWith("http")) return [item];
    if (item && typeof item === "object") {
      const value = item as { url?: string; href?: string };
      const url = value.url || value.href;
      if (url?.startsWith("http")) return [url];
    }
    return [];
  });
}
function formatSize(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

export default function RemixWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [mode, setMode] = useState<"quick" | "custom">("quick");
  const [mixType, setMixType] = useState<"duo" | "wave">("duo");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [vocal, setVocal] = useState("Keep original vocal character");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = track?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [track]);
  useEffect(() => () => { activeAudio?.pause(); }, [activeAudio]);

  useEffect(() => {
    if (!jobs.length) return;
    const pending = jobs.filter((job) => !["succeeded", "failed", "canceled"].includes(job.status));
    if (!pending.length) { setBusy(false); return; }
    const timer = window.setInterval(async () => {
      const updates = await Promise.all(pending.map(async (job) => {
        try {
          const response = await fetch(`/api/remix/${job.id}`, { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Unable to check generation status.");
          return { ...job, ...data };
        } catch (err) {
          return { ...job, error: err instanceof Error ? err.message : "Status check failed." };
        }
      }));
      setJobs((current) => current.map((job) => updates.find((next) => next.id === job.id) || job));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [jobs]);

  const acceptFile = (file?: File) => {
    if (!file) return;
    setError("");
    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/aac"];
    const extensionOK = /\.(mp3|wav|m4a)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extensionOK) { setError("Choose an MP3, WAV, or M4A audio file."); return; }
    if (file.size > 30 * 1024 * 1024) { setError("This file is larger than 30 MB. Choose a smaller audio file."); return; }
    if (track?.url) URL.revokeObjectURL(track.url);
    setTrack({ name: file.name, size: file.size, file, url: URL.createObjectURL(file) });
  };
  const onFile = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files?.[0]); };

  const generate = async () => {
    if (!track) { setError("Upload an audio track before generating a remix."); return; }
    if (!prompt.trim()) { setError("Describe the sound you want, or choose a preset."); return; }
    setError(""); setJobs([]); setBusy(true);
    try {
      const body = new FormData();
      body.set("audio", track.file);
      body.set("prompt", prompt.trim());
      body.set("mixType", mixType);
      body.set("mode", mode);
      body.set("title", title.trim());
      body.set("lyrics", lyrics.trim());
      body.set("instrumental", String(instrumental));
      body.set("vocal", vocal);
      const response = await fetch("/api/remix", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start your remix.");
      setJobs(data.predictions || []);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const play = (url: string) => {
    if (playing === url) { activeAudio?.pause(); setPlaying(null); return; }
    activeAudio?.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => { setPlaying(null); setError("This audio preview could not be played. Try downloading it instead."); };
    setActiveAudio(audio); setPlaying(url); void audio.play();
  };
  const allResults = jobs.flatMap((job, index) => outputUrls(job.output).map((url, outputIndex) => ({ url, label: `Remix ${String.fromCharCode(65 + index + outputIndex)}` }))) as ResultTrack[];
  const isRunning = jobs.some((job) => !["succeeded", "failed", "canceled"].includes(job.status));

  return <div className="studio-shell">
    <div className="studio-topline"><div className="studio-title"><span className="studio-icon"><AudioLines size={18}/></span><div><b>REMIX STUDIO</b><small>YOUR SOUND, REIMAGINED</small></div></div><span className="studio-secure"><span/> REPLICATE AI ENGINE</span></div>
    <div className="studio-content">
      <div className="studio-main">
        <div className="step-heading"><span>01</span><div><h3>Bring your track</h3><p>Start with a song you want to transform.</p></div></div>
        {!track ? <div className={`upload-zone ${dragging ? "is-dragging" : ""}`} onDragOver={(e)=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={onDrop} onClick={()=>inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();inputRef.current?.click();}}}>
          <input ref={inputRef} type="file" accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4" onChange={onFile} hidden/>
          <span className="upload-icon"><Upload size={23}/></span><b>Drop your audio here</b><span>or <u>browse files</u> to upload</span><small>MP3, WAV, M4A · Up to 30 MB · Max 8 minutes</small>
        </div> : <div className="uploaded-track"><span className="file-icon"><FileAudio size={21}/></span><div className="uploaded-meta"><b>{track.name}</b><small>{formatSize(track.size)} · Ready to remix</small></div><button className="icon-button" onClick={()=>{URL.revokeObjectURL(track.url);setTrack(null);if(inputRef.current)inputRef.current.value="";}} aria-label="Remove track"><X size={17}/></button></div>}
        {track && <audio className="source-audio" controls src={track.url}/>}
        <div className="step-heading second-step"><span>02</span><div><h3>Choose your direction</h3><p>Pick a starting point or describe your own sound.</p></div></div>
        <div className="mode-tabs"><button className={mode==="quick"?"active":""} onClick={()=>setMode("quick")}><Sparkles size={15}/> Quick remix</button><button className={mode==="custom"?"active":""} onClick={()=>setMode("custom")}><AudioLines size={15}/> Custom remix</button></div>
        <label className="field-label" htmlFor="remix-prompt">{mode==="quick"?"DESCRIBE YOUR NEW SOUND":"STYLE & PRODUCTION DIRECTION"} <span>REQUIRED</span></label>
        <textarea id="remix-prompt" className="prompt-input" value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="e.g. Reimagine this as a dreamy melodic house track with warm synths, deep bass, and uplifting energy..." maxLength={1200}/>
        <div className="prompt-footer"><span>Be specific about genre, mood, instruments, and energy.</span><span>{prompt.length}/1200</span></div>
        <div className="preset-row">{presets.map((preset)=><button key={preset.name} className={prompt===preset.prompt?"selected":""} onClick={()=>setPrompt(preset.prompt)}>{preset.name}</button>)}</div>
        {mode==="custom" && <div className="custom-fields">
          <label className="field-label" htmlFor="track-title">NEW TRACK TITLE</label><input id="track-title" className="text-input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Give your remix a name"/>
          <label className="field-label" htmlFor="lyrics">LYRICS OR VOCAL DIRECTION</label><textarea id="lyrics" className="prompt-input lyrics-input" value={lyrics} onChange={(e)=>setLyrics(e.target.value)} placeholder="Optional: describe lyrical changes or add lyrics..." maxLength={3000}/>
          <label className="check-row"><input type="checkbox" checked={instrumental} onChange={(e)=>setInstrumental(e.target.checked)}/><span>Instrumental direction (no vocal focus)</span></label>
          <label className="field-label" htmlFor="vocal-style">VOCAL DIRECTION</label><div className="select-wrap"><select id="vocal-style" value={vocal} onChange={(e)=>setVocal(e.target.value)}><option>Keep original vocal character</option><option>Soft and intimate</option><option>Powerful and expressive</option><option>Airy and ethereal</option><option>Instrumental focus</option></select><ChevronDown size={16}/></div>
          <p className="custom-note">These settings guide the generation prompt. Model support for lyric rewriting and vocal separation depends on the selected Replicate model.</p>
        </div>}
        <div className="step-heading third-step"><span>03</span><div><h3>Pick your mix</h3><p>How many variations do you want to explore?</p></div></div>
        <div className="mix-options">
          <button className={mixType==="duo"?"mix-option chosen":"mix-option"} onClick={()=>setMixType("duo")}><span className="mix-option-icon"><span/><span/></span><span className="mix-option-copy"><b>Duo Mix</b><small>Two independent remix takes</small></span><span className="mix-check">{mixType==="duo"&&<Check size={13}/>}</span></button>
          <button className={mixType==="wave"?"mix-option chosen":"mix-option"} onClick={()=>setMixType("wave")}><span className="mix-option-icon wave-option"><AudioLines size={22}/></span><span className="mix-option-copy"><b>Wave Mix</b><small>One focused remix take</small></span><span className="mix-check">{mixType==="wave"&&<Check size={13}/>}</span></button>
        </div>
        <button className="generate-button" onClick={generate} disabled={busy}>{busy?<><LoaderCircle className="spin" size={18}/> Starting your remix...</>:<><Sparkles size={18}/> Generate {mixType==="duo"?"two remixes":"a remix"} <span>↗</span></>}</button>
        <p className="generation-disclaimer">Generation uses a third-party AI model and may incur Replicate charges. Only upload audio you have rights to use.</p>
        {error && <div className="error-message"><CircleAlert size={17}/>{error}</div>}
      </div>
      <aside className="studio-aside">
        <div className="aside-card"><div className="aside-card-title"><span>✳</span> YOUR SESSION</div><div className="session-art"><div className="session-record"><div/></div><div className="session-art-copy"><span>NOW PLAYING IN YOUR HEAD</span><b>{track?track.name:"Your next favorite remix"}</b><small>{track?"Source track loaded":"Upload a track to begin"}</small></div></div><div className="session-detail"><span>INPUT FORMAT</span><b>{track?track.name.split(".").pop()?.toUpperCase():"MP3 / WAV / M4A"}</b></div><div className="session-detail"><span>GENERATION MODE</span><b>{mixType==="duo"?"2 REMIX TAKES":"1 REMIX TAKE"}</b></div><div className="session-detail"><span>AI MODEL</span><b>MUSICGEN REMIXER</b></div></div>
        <div className="aside-tip"><Sparkles size={17}/><div><b>A little prompt magic</b><p>Try combining a genre with a mood and two or three signature instruments for a more intentional result.</p></div></div>
        <div className="aside-rights"><b>Respect the source.</b><p>Make sure you own or have permission to remix the audio you upload.</p></div>
      </aside>
    </div>
    {(jobs.length>0 || isRunning) && <div className="results-panel"><div className="results-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> THE RESULTS</span><h3>Your new frequencies.</h3></div><button className="icon-button" onClick={()=>{setJobs([]);setBusy(false);}} aria-label="Clear results"><X size={17}/></button></div>
      <div className="result-grid">{jobs.map((job,index)=>{const urls=outputUrls(job.output);return <div className="result-card" key={job.id}><div className="result-card-head"><span className="result-letter">{String.fromCharCode(65+index)}</span><div><b>Remix take {index+1}</b><small>{job.status==="succeeded"?"READY TO PLAY":job.status.toUpperCase()}</small></div><span className={`job-status ${job.status}`}>{job.status==="succeeded"?<Check size={14}/>:job.status==="failed"?<CircleAlert size={14}/>:<LoaderCircle size={14} className="spin"/>}</span></div>{urls.length?urls.map((url,i)=><div className="audio-result" key={url}><button className="play-result" onClick={()=>play(url)}>{playing===url?<Pause size={16}/>:<Play size={16}/>}</button><span>{urls.length>1?`Output ${i+1}`:"Generated remix"}</span><a href={url} target="_blank" rel="noreferrer" download><Download size={15}/> Download</a></div>):<div className="result-wait">{job.status==="failed"?(job.error||"The model could not complete this take."):job.status==="succeeded"?"No playable audio URL was returned.":"Your remix is being created. This can take several minutes."}</div>}</div>})}</div>
      {jobs.some(j=>j.status==="failed")&&<p className="result-help">One or more takes failed. Check your Replicate account and model availability, then try again.</p>}
      {jobs.some(j=>j.status==="succeeded")&&<p className="result-help">Download your results while they are available. Replicate-hosted output files are temporary.</p>}
    </div>}
    {busy&&jobs.length===0&&<div className="starting-banner"><LoaderCircle size={17} className="spin"/> Connecting to the AI music engine and preparing your generation…</div>}
  </div>;
}
