import 'dotenv/config'
import { RingApi, RingCamera } from 'ring-client-api'
import { readFileSync, writeFileSync } from 'fs' // To support rewrite of token

// TODO:  Put some proper log levels into place to reduce console verbosity.

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

async function main() {
  const ringApi = new RingApi({
      // Replace with your refresh token
      refreshToken: process.env.RING_REFRESH_TOKEN!,
      debug: true,
    }),
    cameras = await ringApi.getCameras()

  // Refresh token periodically
  ringApi.onRefreshTokenUpdated.subscribe(
    async ({ newRefreshToken, oldRefreshToken }) => {
      if (!oldRefreshToken) { return }

      // TODO:  Will likely have to tinker with config file location for prod
      const currentConfig = readFileSync('.env'),
        updatedConfig = currentConfig.toString()
          .replace(oldRefreshToken, newRefreshToken)

      writeFileSync('.env', updatedConfig)
    }
  )

  if (cameras.length == 0) {
    console.log('No cameras found')
    return
  }

  var desired_cameras = process.env.USE_CAMERAS!.split(',')

  for (var camera of cameras) {
    if (desired_cameras.indexOf(camera.name) < 0) {
      console.log(`Skipping camers ${camera.name}...`)
      continue
    }

    console.log(`Starting Video for ${camera.name}...`)
    startCamera(camera)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
