import 'dotenv/config'
import { RingApi, RingCamera } from 'ring-client-api'
import * as path from 'path'

async function startCamera(camera: RingCamera) {
    console.log(`(Re)starting call for ${camera.name}`)
    const call = await camera.streamVideo({
      audio: [ '-af', 'volume=0.0' ],  // Mute for privacy
      video: [
        '-vcodec', 'libx264',
        '-vprofile', 'baseline',
        '-vf', 'scale=640x360',
      ],
      output: [
        '-f', 'flv',
        `rtmp://127.0.0.1/live/${camera.name.replace(/ /g,"_")}`
      ],
    })
    console.log(`Video started for ${camera.name}...`)

    call.onCallEnded.subscribe(() => {
      console.log(`Call has ended for ${camera.name}`)
      startCamera(camera)
    })
}

async function example() {
  const ringApi = new RingApi({
      // Replace with your refresh token
      refreshToken: process.env.RING_REFRESH_TOKEN!,
      debug: true,
    }),
    cameras = await ringApi.getCameras()

  if (cameras.length == 0) {
    console.log('No cameras found')
    return
  }

  for (var camera of cameras) {
    console.log(`Starting Video for ${camera.name}...`)
    startCamera(camera)
  }
}

example().catch((e) => {
  console.error(e)
  process.exit(1)
})
