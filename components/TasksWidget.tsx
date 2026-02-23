"use client";

import { useEffect, useRef, useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const SCOPE = "https://www.googleapis.com/auth/tasks.readonly";

export default () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    document.body.appendChild(script);

    // Try to restore session on mount
    fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.access_token) {
          setToken(data.access_token);
          setExpiry(Date.now() + data.expires_in * 1000);
        }
      })
      .catch(() => {});

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!expiry) return;

    // Refresh 2 minutes before expiry
    const delay = expiry - Date.now() - 120000;

    if (refreshTimer.current) clearTimeout(refreshTimer.current);

    refreshTimer.current = setTimeout(
      async () => {
        try {
          const res = await fetch("/api/auth/refresh", { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            setToken(data.access_token);
            setExpiry(Date.now() + data.expires_in * 1000);
          } else {
            setToken(null);
            setExpiry(null);
          }
        } catch (e) {
          console.error("Token refresh failed", e);
          setToken(null);
          setExpiry(null);
        }
      },
      Math.max(0, delay),
    );

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [expiry]);

  const login = () => {
    if (!gisLoaded) return;
    // @ts-expect-error
    const client = google.accounts.oauth2.initCodeClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      ux_mode: "popup",
      callback: async (resp: any) => {
        if (resp.code) {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: resp.code }),
            });
            const data = await res.json();
            if (data.access_token) {
              setToken(data.access_token);
              setExpiry(Date.now() + data.expires_in * 1000);
            }
          } catch (e) {
            console.error("Login failed", e);
          }
        }
      },
    });
    client.requestCode();
  };

  useEffect(() => {
    if (!token) return;
    const fetchTasks = async () => {
      try {
        const res = await fetch(
          "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=5",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.status === 401) {
          // Try to refresh immediately if 401
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setToken(data.access_token);
            setExpiry(Date.now() + data.expires_in * 1000);
          } else {
            setToken(null);
            setExpiry(null);
          }
          return;
        }
        const data = await res.json();
        setTasks(data.items || []);
      } catch (e) {
        console.error("Tasks fetch failed", e);
      }
    };
    fetchTasks();
    const id = setInterval(fetchTasks, 60000);
    return () => clearInterval(id);
  }, [token]);

  if (!CLIENT_ID)
    return (
      <div className="TasksWidget text-red-500">Missing Google Client ID</div>
    );
  if (!token)
    return (
      <div className="TasksWidget">
        <button
          type="button"
          onClick={login}
          disabled={!gisLoaded}
          className="px-4 py-2 bg-blue-600 rounded text-white font-bold disabled:opacity-50"
        >
          Connect Google Tasks
        </button>
      </div>
    );

  return (
    <div className="TasksWidget flex gap-2 overflow-hidden">
      {tasks.length === 0 && (
        <div className="text-gray-500 w-full text-center">No tasks found</div>
      )}
      {tasks.map((t) => (
        <div
          key={t.id}
          className="flex-1 p-3 rounded-lg border border-stone-700 bg-stone-900 flex justify-between items-center min-w-0"
        >
          <span className="text-sm font-semibold truncate" title={t.title}>
            {t.title}
          </span>
        </div>
      ))}
    </div>
  );
};
