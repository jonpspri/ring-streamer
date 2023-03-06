import { RingApi, RingCamera } from 'ring-client-api'
import Conf from 'conf'

const config = new Conf({projectName: 'ring-server'})

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

export async function stream(desired_cameras: string[]) {
  const ringApi = new RingApi({
      // Replace with your refresh token
      refreshToken: config.get('token') as string,
      debug: true,
    }),
    cameras = await ringApi.getCameras()

  // Refresh token periodically
  ringApi.onRefreshTokenUpdated.subscribe(
    async ({ newRefreshToken}) => { config.set('token', newRefreshToken) }
  )

  if (cameras.length == 0) {
    console.log('No cameras found')
    return
  }

  for (var camera of cameras) {
    if (desired_cameras.indexOf(camera.name) < 0) {
      console.log(`Skipping camera ${camera.name}...`)
      continue
    }

    console.log(`Starting Video for ${camera.name}...`)
    startCamera(camera)
  }
}

