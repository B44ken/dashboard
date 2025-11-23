"use client";

import React, { useEffect, useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

// very small types just for now playing
type NowPlaying = { isPlaying: boolean; trackName: string; artistName: string; albumName: string; albumImageUrl?: string; progress: number; };

type TokenState = { accessToken: string; expiresAt: number; };

const LS_ACCESS_TOKEN_KEY = "spotify_access_token";
const LS_EXPIRES_AT_KEY = "spotify_expires_at";
const LS_PKCE_VERIFIER_KEY = "spotify_pkce_verifier";
const LS_AUTH_STATE_KEY = "spotify_auth_state";

const isBrowser = () => typeof window !== "undefined";

const generateRandomString = (length: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// PKCE challenge from verifier (URL-safe base64)
async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = String.fromCharCode(...new Uint8Array(digest));
  return btoa(hash).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// read token from localStorage if valid
function readStoredToken(): TokenState | null {
  if (!isBrowser()) return null;
  const token = window.localStorage.getItem(LS_ACCESS_TOKEN_KEY);
  const expiresAtStr = window.localStorage.getItem(LS_EXPIRES_AT_KEY);
  if (!token || !expiresAtStr) return null;
  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Date.now();
  // add small buffer
  if (Number.isNaN(expiresAt) || now >= expiresAt - 30_000) {
    return null;
  }
  return { accessToken: token, expiresAt };
}

function storeToken(accessToken: string, expiresInSec: number) {
  if (!isBrowser()) return;
  const expiresAt = Date.now() + expiresInSec * 1000;
  window.localStorage.setItem(LS_ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(LS_EXPIRES_AT_KEY, String(expiresAt));
}

function clearToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(LS_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(LS_EXPIRES_AT_KEY);
}

const SpotifyWidget: React.FC = () => {
  const [token, setToken] = useState<TokenState | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // helper for calling Spotify Web API
  const callApi = async (path: string,options: RequestInit = {}): Promise<Response | null> => {
    if (!token) return null;
    try {
      const res = await fetch(`https://api.spotify.com/v1/${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      if (res.status === 401) {
        // token expired or invalid
        clearToken();
        setToken(null);
      }
      return res;
    } catch (e) {
      console.error("Spotify API error", e);
      return null;
    }
  };

  const fetchNowPlaying = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await callApi("me/player/currently-playing");
      if (!res) return;
      if (res.status === 204) {
        // nothing playing
        setNowPlaying(null);
        return;
      }
      if (!res.ok) {
        console.error("Error fetching now playing", res.status);
        setNowPlaying(null);
        return;
      }
      const data = await res.json();
      if (!data || !data.item) {
        setNowPlaying(null);
        return;
      }
      const item = data.item;
      const albumImages = item.album?.images || [];
      const firstImg = albumImages[0];

      setNowPlaying({
        isPlaying: !!data.is_playing,
        trackName: item.name,
        artistName: (item.artists || []).map((a: any) => a.name).join(", "),
        albumName: item.album?.name ?? "",
        albumImageUrl: firstImg?.url,
        progress: data.progress_ms / item.duration_ms,
      });
    } catch (e) {
      console.error("now playing parse error", e);
    } finally {
      setLoading(false);
    }
  };

  const startAuth = async () => {
    setAuthError(null);
    if (!isBrowser()) return;
    if (!CLIENT_ID || !REDIRECT_URI) {
      setAuthError("Missing Spotify OAuth env vars.");
      return;
    }

    const state = generateRandomString(16);
    const verifier = generateRandomString(64);
    const challenge = await generateCodeChallenge(verifier);

    window.localStorage.setItem(LS_PKCE_VERIFIER_KEY, verifier);
    window.localStorage.setItem(LS_AUTH_STATE_KEY, state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope:
        "user-read-playback-state user-modify-playback-state user-read-currently-playing",
    });

    window.location.href =
      "https://accounts.spotify.com/authorize?" + params.toString();
  };

  // on first load: check for stored token or handle redirect with ?code=
  useEffect(() => {
    if (!isBrowser()) return;

    // 1) existing token
    const stored = readStoredToken();
    if (stored) {
      setToken(stored);
    }

    // 2) check URL for ?code and ?state
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = window.localStorage.getItem(LS_AUTH_STATE_KEY);
    const verifier = window.localStorage.getItem(LS_PKCE_VERIFIER_KEY);

    if (code && state && storedState && verifier && state === storedState) {
      // consume them once
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      window.history.replaceState({}, "", url.toString());
      window.localStorage.removeItem(LS_AUTH_STATE_KEY);

      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: verifier,
      });

      (async () => {
        try {
          const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          });

          if (!res.ok) {
            console.error("Token exchange failed", res.status);
            setAuthError("Spotify auth failed.");
            return;
          }

          const data = await res.json();
          const accessToken = data.access_token as string;
          const expiresIn = data.expires_in as number; // seconds

          storeToken(accessToken, expiresIn);
          setToken({
            accessToken,
            expiresAt: Date.now() + expiresIn * 1000,
          });
        } catch (e) {
          console.error("Token exchange error", e);
          setAuthError("Spotify auth failed.");
        } finally {
          window.localStorage.removeItem(LS_PKCE_VERIFIER_KEY);
        }
      })();
    }
  }, []);

  // polling loop
  useEffect(() => {
    if (!token) return;
    fetchNowPlaying();
    const id = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.accessToken]);

  // UI

  if (!CLIENT_ID || !REDIRECT_URI) {
    return (
      <div className="widget-card-tight">
        <div className="text-xs text-widget-muted tracking-[0.1em] mb-2">
          SPOTIFY
        </div>
        <div className="text-sm text-red-400">
          Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID or
          NEXT_PUBLIC_SPOTIFY_REDIRECT_URI.
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card h-[200px]">
      {/* body */}
      {!token && (
        <div className="flex flex-col items-start gap-2">
          <div className="text-sm text-widget-muted mb-2">
            Connect your Spotify account to show what&apos;s playing.
          </div>
          <button
            onClick={startAuth}
            className="btn-spotify"
          >
            Connect Spotify
          </button>
          {authError && (
            <div className="text-xs text-red-400 mt-1">{authError}</div>
          )}
        </div>
      )}

      {token && (
        <>
          {loading && !nowPlaying && <div className="text-sm text-widget-muted">..</div>}

          {!loading && !nowPlaying && (
            <div className="text-sm text-widget-muted">
              Nothing playing right now
            </div>
          )}

          {nowPlaying && (
            <div className="flex gap-3 h-full">
              {nowPlaying.albumImageUrl && (
                <img
                  src={nowPlaying.albumImageUrl}
                  alt={nowPlaying.albumName}
                  className="rounded-lg h-full border border-[#333]"
                />
              )}

              <div className="flex-1 h-full">
                <div className="text-base font-semibold"> {nowPlaying.trackName} </div>
                <div className="text-sm text-widget-muted pt-2"> {nowPlaying.artistName} ({nowPlaying.albumName}) </div>

                <div className="widget-progress-track">
                  <div
                    className="widget-progress-bar duration-5000"
                    style={{ width: `${nowPlaying.progress * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {authError && ( <div className="text-xs text-red-400 mt-2">{authError}</div> )}
        </>
      )}
    </div>
  );
};

export default SpotifyWidget;