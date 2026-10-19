'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setVideoUrl(null)
      setError(null)
    }
  }

  const generate = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('photo', file)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
      } else {
        setError(data.error || 'Error generando el video')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2">Ozil Goal <span className="text-red-500">AI</span></h1>
        <p className="text-zinc-400 text-center mb-8">Sube una foto y recrea el gol de Özil</p>

        <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 text-center mb-6">
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" id="upload" />
          <label htmlFor="upload" className="cursor-pointer">
            {preview ? (
              <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-xl" />
            ) : (
              <div className="py-10 text-zinc-400">Haz clic para subir una foto</div>
            )}
          </label>
        </div>

        <button
          onClick={generate}
          disabled={!file || loading}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white font-bold py-4 rounded-xl text-lg"
        >
          {loading ? 'Generando...' : 'Generar Video'}
        </button>

        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

        {videoUrl && (
          <div className="mt-6">
            <video src={videoUrl} controls className="w-full rounded-xl" />
          </div>
        )}
      </div>
    </main>
  )
}
