import { RingApi, RingCamera } from 'ring-client-api'
import Conf from 'conf'
import { logger } from './index.js'

const config = new Conf({projectName: 'ring-server'})

async function startCamera(camera: RingCamera) {
  logger.debug(`(Re)starting video for ${camera.name}`)
  const call = await camera.streamVideo({
    audio: [ '-af', 'volume=0.0' ],  // Mute for privacy
    video: [ '-vcodec', 'libx264',
      '-vprofile', 'baseline',
      '-vf', 'scale=640x360', ],
    output: [ '-f', 'flv',
      `rtmp://127.0.0.1/live/${camera.name.replace(/ /g,"_")}` ],
  })
  logger.info(`Video started for ${camera.name}`)

  call.onCallEnded.subscribe(() => {
    logger.debug(`Call has ended for ${camera.name}`)
    startCamera(camera)
  })
}

export async function stream(desired_camera: string) {
  const ringApi = new RingApi({
      refreshToken: config.get('token') as string,
      debug: true,
    })
  ringApi.onRefreshTokenUpdated.subscribe(
    async ({ newRefreshToken }) => { config.set('token', newRefreshToken) }
  )

  const camera = (await ringApi.getCameras()).find( x => x.name === desired_camera );
  if (!camera) {
    logger.error(`The camera ${camera} is not supported by the Ring API`);
    return 1;
  }

  startCamera(camera)
}

