import 'dotenv/config'
import { RingApi, RingCamera } from 'ring-client-api'
import { readFileSync, writeFileSync } from 'fs'
import * as path from 'path'

async function main() {
  const env = process.env,
    ringApi = new RingApi({
      // Replace with your refresh token
      refreshToken: process.env.RING_REFRESH_TOKEN!,
      debug: true,
    }),
    cameras = await ringApi.getCameras()

  ringApi.onRefreshTokenUpdated.subscribe(
    async ({ newRefreshToken, oldRefreshToken }) => {
      console.log('Refresh Token Updated: ', newRefreshToken)

      // If you are implementing a project that use `ring-client-api`, you 
      // should subscribe to onRefreshTokenUpdated and update your config 
      // each time it fires an event.

      // Here is an example using a .env file for configuration
      if (!oldRefreshToken) { return }

      // TODO:  Will likely have to tinker with the file location for prod
      const currentConfig = readFileSync('.env'),
        updatedConfig = currentConfig .toString()
          .replace(oldRefreshToken, newRefreshToken)

      await writeFileSync('.env', updatedConfig)
    }
  )
 
  if (cameras.length == 0) {
    console.log('No cameras found')
    return
  }

  for (var camera of cameras) {
    console.log(`Retreiving snapshot from ${camera.name}...`)

    const response = await camera.getSnapshot();
    await writeFileSync(`${camera.name.replace(/ /g, "_")}.jpg`, response)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
