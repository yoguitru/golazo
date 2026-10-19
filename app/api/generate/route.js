import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY
const OZIL_BASE_VIDEO_URL = process.env.OZIL_BASE_VIDEO_URL || "https://pub-d32207fa9a73400ca3dd385d6d72f436.r2.dev/golaco.mp4"

export async function POST(req) {
  try {
    if (!RUNWARE_API_KEY) {
      return NextResponse.json({ error: 'Falta RUNWARE_API_KEY' }, { status: 500 })
    }

    const formData = await req.formData()
    const photo = formData.get('photo')

    if (!photo) {
      return NextResponse.json({ error: 'No se recibió ninguna foto' }, { status: 400 })
    }

    const bytes = await photo.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mime = photo.type || 'image/jpeg'
    const dataUri = `data:${mime};base64,${base64}`

    const taskUUID = uuidv4()

    const payload = [
      {
        taskType: "videoInference",
        taskUUID,
        model: "prunaai:p-video@replace",
        deliveryMethod: "async",
        inputs: {
          video: OZIL_BASE_VIDEO_URL,
          referenceImages: [dataUri]
        },
        resolution: "720p",
        positivePrompt: "Replace the footballer with the person from the reference image. Preserve the original motion, ball, camera and timing."
      }
    ]

    const startRes = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWARE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!startRes.ok) {
      const err = await startRes.text()
      return NextResponse.json({ error: 'Error en Runware', details: err }, { status: 500 })
    }

    let videoUrl = null
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 6000))

      const pollRes = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RUNWARE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          taskType: "getResponse",
          taskUUID
        }])
      })

      const pollData = await pollRes.json()
      const result = Array.isArray(pollData) ? pollData[0] : pollData

      if (result?.videoURL || result?.videoUrl) {
        videoUrl = result.videoURL || result.videoUrl
        break
      }

      if (result?.status === 'error' || result?.error) {
        return NextResponse.json({ error: 'Error en la generación', details: result }, { status: 500 })
      }
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'Timeout' }, { status: 504 })
    }

    return NextResponse.json({ videoUrl })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
