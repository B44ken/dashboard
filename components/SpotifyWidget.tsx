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

  const refresh = async () => {
    const rt = window.localStorage.getItem("spotify_refresh_token");
    if (!rt) return;
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token", refresh_token: rt, client_id: CLIENT_ID
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        window.localStorage.setItem("spotify_access_token", data.access_token);
        window.localStorage.setItem("spotify_expires_at", String(Date.now() + data.expires_in * 1000));
        if (data.refresh_token) window.localStorage.setItem("spotify_refresh_token", data.refresh_token);
        setToken(data.access_token);
      } else {
        setToken(null);
      }
    } catch { setToken(null); }
  };

  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
    else refresh();

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
          if (data.refresh_token) window.localStorage.setItem("spotify_refresh_token", data.refresh_token);
          setToken(data.access_token);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const update = () => fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async r => {
      if (r.status === 401) { await refresh(); return null; }
      return r.status === 200 ? r.json() : null;
    }).then(d => d && setNowPlaying(d)).catch(() => { });
    update();
    const id = setInterval(update, 3000);
    return () => clearInterval(id);
  }, [token]);

  if (!CLIENT_ID) return <div className="SpotifyWidget text-red-500">Missing Client ID</div>;
  if (!token) return <div className="SpotifyWidget"><button onClick={login} className="btn-spotify">Connect Spotify</button></div>;
  if (!nowPlaying?.item) return <div className="SpotifyWidget text-gray-500">Nothing playing</div>;

  const progress = nowPlaying.progress_ms / nowPlaying.item.duration_ms, image = nowPlaying.item.album.images[0].url, name = nowPlaying.item.name, artists = nowPlaying.item.artists.map((a: any) => a.name);
  return <div className="SpotifyWidget bg-cover rounded-lg overflow-clip" style={{ backgroundImage: `url(${image})` }}>
    <div className="flex flex-col h-full justify-end backdrop-blur-xs font-bold bg-black/60">
      <div className="my-1 mx-3"><div className="text-lg text-bold">{name}</div><div className="text-sm">{artists}</div></div>
      <div className="m-1 bg-red-500 h-2 duration-3000 ease-linear rounded-lg" style={{ width: `${progress * 100}%` }} />
    </div>
  </div>;
};