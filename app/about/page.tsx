import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, AudioWaveform, Code2, ExternalLink, Github, Music2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About the Developer — MusicAI",
  description: "Meet the developer behind MusicAI, an independent AI-powered music remix studio."
};

type GithubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  html_url: string;
  avatar_url: string;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
};

type GithubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
};

async function getDeveloperData() {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "MusicAI-About-Page" };
  try {
    const [profileResponse, reposResponse] = await Promise.all([
      fetch("https://api.github.com/users/casndrih", { headers, next: { revalidate: 3600 } }),
      fetch("https://api.github.com/users/casndrih/repos?sort=updated&per_page=6&type=owner", { headers, next: { revalidate: 3600 } })
    ]);
    if (!profileResponse.ok) throw new Error("GitHub profile is temporarily unavailable.");
    const profile = await profileResponse.json() as GithubProfile;
    const repos = reposResponse.ok ? await reposResponse.json() as GithubRepo[] : [];
    return { profile, repos: repos.filter((repo) => !repo.fork).slice(0, 4), unavailable: false };
  } catch {
    return { profile: null, repos: [], unavailable: true };
  }
}

export default async function AboutPage() {
  const { profile, repos, unavailable } = await getDeveloperData();
  const developerName = profile?.name || "Casper Ndrih";

  return <main className="about-page">
    <div className="about-topbar">
      <a className="brand" href="/"><span className="brand-mark"><AudioWaveform size={22}/></span><span>music<span className="brand-accent">ai</span></span></a>
      <a className="about-back" href="/"><ArrowLeft size={15}/> Back to MusicAI</a>
    </div>
    <section className="about-hero">
      <div className="about-hero-glow"/>
      <div className="eyebrow"><span className="eyebrow-dot"/> THE PERSON BEHIND THE PROJECT</div>
      <h1>Built with curiosity.<br/><em>Made for music.</em></h1>
      <p>MusicAI is an independent project designed and developed by <strong>{developerName}</strong>. I built it to make experimenting with new musical directions feel simple, creative and accessible.</p>
      <a className="button button-primary" href="/#remixer"><Sparkles size={17}/> Try the remixer <ArrowUpRight size={16}/></a>
    </section>
    <section className="about-content">
      <article className="developer-card">
        <div className="developer-avatar">{developerName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
        <div className="developer-copy">
          <span className="muted-label">DEVELOPER PROFILE</span>
          <h2>{developerName}</h2>
          <a className="github-handle" href="https://github.com/casndrih" target="_blank" rel="noreferrer">@casndrih <ExternalLink size={13}/></a>
          <p>{profile?.bio || "Software developer building web and mobile applications, tools and creative technology."}</p>
          {profile?.location && <span className="developer-location">{profile.location}</span>}
          <a className="button button-primary developer-profile-link" href="https://github.com/casndrih" target="_blank" rel="noreferrer"><Github size={16}/> View GitHub profile <ArrowUpRight size={15}/></a>
        </div>
        <div className="github-stats">
          <div><b>{profile ? profile.public_repos : "—"}</b><span>PUBLIC REPOS</span></div>
          <div><b>{profile ? profile.followers : "—"}</b><span>FOLLOWERS</span></div>
          <div><b>{profile ? profile.following : "—"}</b><span>FOLLOWING</span></div>
        </div>
        {unavailable && <p className="github-note">Live GitHub profile details could not be loaded right now. The profile link remains available.</p>}
      </article>
      <div className="about-story-grid">
        <article className="about-story">
          <span className="about-story-icon"><Code2 size={20}/></span>
          <span className="muted-label">THE BUILD</span>
          <h3>Designed and developed by me.</h3>
          <p>I created the MusicAI experience, built the responsive interface and connected the remix workflow to an AI music generation service. The project is developed independently and its source code is public on GitHub.</p>
        </article>
        <article className="about-story">
          <span className="about-story-icon"><Music2 size={20}/></span>
          <span className="muted-label">THE IDEA</span>
          <h3>Explore another side of a song.</h3>
          <p>Upload an audio track, describe a new genre or production direction, then generate one or two alternate interpretations with the configured AI model.</p>
        </article>
      </div>
      <div className="about-project-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> OPEN SOURCE PROJECT</div><h2>More from <em>GitHub.</em></h2></div><a className="text-link" href="https://github.com/casndrih/MusicAI" target="_blank" rel="noreferrer">MusicAI source code <ArrowUpRight size={15}/></a></div>
      <div className="about-repo-grid">
        {repos.map((repo) => <a className="about-repo-card" key={repo.name} href={repo.html_url} target="_blank" rel="noreferrer"><div><Github size={17}/><span>{repo.fork ? "FORK" : "REPOSITORY"}</span><ArrowUpRight size={15}/></div><h3>{repo.name}</h3><p>{repo.description || "A public project on GitHub."}</p><footer><span>{repo.language || "Code"}</span><span>★ {repo.stargazers_count}</span></footer></a>)}
        {!repos.length && <a className="about-repo-card" href="https://github.com/casndrih/MusicAI" target="_blank" rel="noreferrer"><div><Github size={17}/><span>FEATURED REPOSITORY</span><ArrowUpRight size={15}/></div><h3>MusicAI</h3><p>Explore the source code for this independent AI music remix studio.</p><footer><span>Next.js · TypeScript</span><span>View project ↗</span></footer></a>}
      </div>
    </section>
    <footer className="about-footer"><a className="brand" href="/"><span className="brand-mark"><AudioWaveform size={20}/></span><span>music<span className="brand-accent">ai</span></span></a><span>Independent project by <a href="https://github.com/casndrih" target="_blank" rel="noreferrer">casndrih</a>.</span></footer>
  </main>;
}
