"use client";

import { useEffect, useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

const generateRandomString = (length: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const generateCodeChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("spotify_access_token");
  const expiresAt = parseInt(window.localStorage.getItem("spotify_expires_at") || "0", 10);
  return (token && Date.now() < expiresAt - 30_000) ? token : null;
};

export default () => {
  const [token, setToken] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<any | null>(null);

  const login = async () => {
    const verifier = generateRandomString(64);
    window.localStorage.setItem("spotify_pkce_verifier", verifier);
    const params = new URLSearchParams({
      response_type: "code", client_id: CLIENT_ID, redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256", code_challenge: await generateCodeChallenge(verifier),
      scope: "user-read-playback-state user-modify-playback-state user-read-currently-playing",
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  };

  useEffect(() => {
    const t = getToken();
    if (t) { setToken(t); return; }

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const verifier = window.localStorage.getItem("spotify_pkce_verifier");

    if (code && verifier) {
      window.history.replaceState({}, "", "/");
      fetch("https://accounts.spotify.com/api/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID, code_verifier: verifier,
        }),
      }).then(res => res.json()).then(data => {
        if (data.access_token) {
          window.localStorage.setItem("spotify_access_token", data.access_token);
          window.localStorage.setItem("spotify_expires_at", String(Date.now() + data.expires_in * 1000));
          setToken(data.access_token);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const update = () => fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.status === 200 ? r.json() : null).then(setNowPlaying).catch(() => setToken(null));
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [token]);

  if (!CLIENT_ID) return <div className="SpotifyWidget text-red-500">Missing Client ID</div>;
  if (!token) return <div className="SpotifyWidget"><button onClick={login} className="btn-spotify">Connect Spotify</button></div>;
  if (!nowPlaying?.item) return <div className="SpotifyWidget text-gray-500">Nothing playing</div>;

  const { item, progress_ms } = nowPlaying;
  return <div className="SpotifyWidget flex gap-3 h-full items-center">
    {item.album.images[0] && <img src={item.album.images[0].url} className="h-full rounded border border-stone-700 aspect-square object-cover" />}
    <div className="flex-1 min-w-0 flex flex-col justify-center">
      <div className="font-bold truncate">{item.name}</div>
      <div className="text-sm text-gray-500 truncate">{item.artists.map((a: any) => a.name).join(", ")}</div>
      <div className="widget-progress-track mt-2">
        <div className="widget-progress-bar" style={{ width: `${(progress_ms / item.duration_ms) * 100}%` }} />
      </div>
    </div>
  </div>;
};