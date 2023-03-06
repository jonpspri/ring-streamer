import { Command } from 'commander'
import figlet from 'figlet'
import Conf from 'conf'

import { stream } from './ring-streamer.js'

const program = new Command()
const config = new Conf({projectName: 'ring-server'})

console.log(figlet.textSync('Ring Server'));

program
  .name('ring-server')
  .description('CLI to manage server-like Ring activities')
  .version('0.0.1')

program.command('seed-token')
  .description('Seed the Ring token with the provided value')
  .argument('<token>', 'The token as provided by ...')
  .action((token, _options, _command) => { config.set('token', token) })

program.command('serve-camera')
  .description('Serve video from the given cameras via NGinx')
  .option('-t, --token <token>', 'Ring token for initial request')
  .argument('<camera...>', 'The name(s) of the camera(s) to server')
  .action((camera, options, _command) => {
    if (options.token) { config.set('token', options.token) }
    stream(camera)
  })

program.parse(process.argv)
