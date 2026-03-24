'use client'
import { useEffect, useState } from 'react'

const useVideoPath = (): string => {
    const [path, setPath] = useState('')
    const [retry, setRetry] = useState(4)
    useEffect(() => {
        const i = setInterval(() => fetch('https://local.boratto.ca/video.txt')
            .then(x => x.text())
            .then(p => { path != p && setPath(p); setRetry(4) })
            .catch(() => setRetry(retry - 1)), 2500)
        return () => clearInterval(i)
    }, [])
    return retry > 0 ? path : ''
}

export default () => {
    const path = useVideoPath()
    return path ? <video className="VideoWidget" controls autoPlay src={'https://local.boratto.ca/' + path} /> : ''
}