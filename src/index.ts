#!/usr/bin/env node
import { Command } from 'commander'
import Conf from 'conf'
import { pino } from 'pino'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

import { stream } from './ring-streamer.js'

console.log(process.env.LOG_FILE)

export var logger : pino.Logger

const version = process.env.npm_package_version as string
const program = new Command()
const config = new Conf({projectName: 'ring-server'})

program
  .name('ring-server')
  .description('CLI to manage server-like Ring activities')
  .version(version)
  .hook('preAction', (_thisCommand, actionCommand) => {
    //  This happens in a preAction hook because a parsing exit is too fast
    //  for the log to keep up with and results to help to Stdout anyway
    logger = pino({
      name: 'ring-streamer',
      level: process.env.LEVEL || 'info'
    }, pino.destination(process.env.LOG_FILE || 1))

    logger.info(`Ring Server version ${version}`)
    logger.info(`Starting at ${dayjs().format('MMMM D YYYY, HH:mm:ss z')}`)
    logger.debug(`Executing ${actionCommand.name()}`)
  })

program.command('seed-token')
  .description('Seed the Ring token with the provided value')
  .argument('<token>', 'The token as provided by ...')
  .action((token, _options, _command) => { config.set('token', token) })

program.command('serve-camera')
  .description('Serve video from the given cameras via NGinx')
  .option('-t, --token <token>', 'Ring token for initial request')
  .argument('<camera>', 'The name(s) of the camera(s) to server')
  .action((camera, options, _command) => {
    if (options.token) { config.set('token', options.token) }
    stream(camera)
  })

program.parse(process.argv)

