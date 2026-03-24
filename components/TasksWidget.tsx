'use client'

import { useEffect, useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"

const SCOPE = "https://www.googleapis.com/auth/tasks.readonly"

export default () => {
    const [tasks, setTasks] = useState<any[]>([])
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const t = localStorage.getItem('gtasks_token')
        if (t && Date.now() < +(localStorage.getItem('gtasks_expiry') || 0)) setToken(t)
    }, [])

    const login = useGoogleLogin({
        scope: SCOPE,
        onSuccess: (r) => {
            localStorage.setItem('gtasks_token', r.access_token)
            localStorage.setItem('gtasks_expiry', String(Date.now() + (r.expires_in || 3599) * 1000))
            setToken(r.access_token)
        },
    })

    useEffect(() => {
        if (!token) return
        const fetchTasks = async () => {
            const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=5", {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => null)
            if (!res) return
            if (res.status === 401) { login(); return }
            setTasks((await res.json()).items || [])
        }
        fetchTasks()
        const id = setInterval(fetchTasks, 60000)
        return () => clearInterval(id)
    }, [token])

    if (!token) return <div className="TasksWidget"><button onClick={() => login()} className="px-4 py-2 rounded-lg text-white bg-stone-800">Connect Google Tasks</button></div>

    return <div className="TasksWidget flex gap-2 overflow-hidden">
        {tasks.length == 0 && <div className="text-gray-500 w-full text-center">No tasks found</div>}
        {tasks.map(t => (
            <div key={t.id} className="flex-1 p-3 rounded-lg border border-stone-700 bg-stone-900 flex justify-between items-center min-w-0">
                <span className="text-sm font-semibold truncate" title={t.title}>{t.title}</span>
            </div>
        ))}
    </div>
}
