"use client";

import { useEffect, useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const SCOPE = "https://www.googleapis.com/auth/tasks.readonly";

export default () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [gisLoaded, setGisLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => setGisLoaded(true);
        document.body.appendChild(script);

        const t = window.localStorage.getItem("google_tasks_token");
        const exp = parseInt(window.localStorage.getItem("google_tasks_expires_at") || "0", 10);
        if (t && Date.now() < exp) setToken(t);
    }, []);

    const login = () => {
        if (!gisLoaded) return;
        // @ts-ignore
        const client = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPE,
            callback: (resp: any) => {
                if (resp.access_token) {
                    window.localStorage.setItem("google_tasks_token", resp.access_token);
                    window.localStorage.setItem("google_tasks_expires_at", String(Date.now() + (resp.expires_in || 3599) * 1000));
                    setToken(resp.access_token);
                }
            },
        });
        client.requestAccessToken();
    };

    useEffect(() => {
        if (!token) return;
        const fetchTasks = async () => {
            try {
                const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=5", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 401) {
                    setToken(null);
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

    if (!CLIENT_ID) return <div className="TasksWidget text-red-500">Missing Google Client ID</div>;
    if (!token) return <div className="TasksWidget"><button onClick={login} disabled={!gisLoaded} className="px-4 py-2 bg-blue-600 rounded text-white font-bold disabled:opacity-50">Connect Google Tasks</button></div>;

    return <div className="TasksWidget flex gap-2 overflow-hidden">
        {tasks.length === 0 && <div className="text-gray-500 w-full text-center">No tasks found</div>}
        {tasks.map(t => (
            <div key={t.id} className="flex-1 p-3 rounded-lg border border-stone-700 bg-stone-900 flex justify-between items-center min-w-0">
                <span className="text-sm font-semibold truncate" title={t.title}>{t.title}</span>
            </div>
        ))}
    </div>
};
