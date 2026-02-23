'use client'
import React, { useEffect, useState } from 'react'

const useVideoPath = (): string | null => {
    const [path, setPath] = useState<string | null>(null)
    useEffect(() => {
        const i = setInterval(() => fetch('https://local.boratto.ca/video.txt').then(x => x.text()).then(p => path != p && setPath(p)).catch(() => { setPath(null) }), 1000)
        return () => clearInterval(i)
    }, [])
    return path
}

export default () => {
    const path = useVideoPath()
    return path ? <video className="VideoWidget" controls autoPlay src={'https://local.boratto.ca/' + path} /> : null
}