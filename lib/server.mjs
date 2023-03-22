import * as url from 'url';
import ConnectSse from 'connect-sse';
import express, { json, urlencoded, static as expressStatic } from 'express'
import { randomBytes } from 'crypto'
import { join } from 'path'
import raven from 'raven';

import cors from 'cors'

import channelIsBanned from './channel-is-banned-middleware.mjs'
import EventBus from './event-bus.mjs'
import KeepAlive from './keep-alive.mjs'

import helmet from 'helmet';
import expressSslify from 'express-sslify';

const sse = ConnectSse()
const { config, requestHandler, errorHandler } = raven;

// Tiny logger to prevent logs in tests
const log = process.env.NODE_ENV === 'test' ? _ => _ : console.log

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));


export default (testRoute) => {
  const app = express()
  const pubFolder = join(__dirname, '..', 'public')
  const bus = new EventBus()

  // Used for testing route error handling
  if (testRoute) testRoute(app)

  app.use(channelIsBanned)

  if (process.env.SENTRY_DSN) {
    config(process.env.SENTRY_DSN).install()
    app.use(requestHandler())
  }

  if (process.env.FORCE_HTTPS) {
    app.use(helmet())
    app.use(expressSslify.HTTPS({ trustProtoHeader: true }))
  }

  app.use(cors())
  app.use(json())
  app.use(urlencoded({ extended: true }))
  app.use('/public', expressStatic(pubFolder))


  app.get('/new', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.get('host')
    const channel = randomBytes(12)
      .toString('base64')
      .replace(/[+/=]+/g, '')

    res.redirect(307, `${protocol}://${host}/${channel}`)
  })

  app.get('/:channel', (req, res, next) => {
    const { channel } = req.params

    if (req.accepts('html')) {
      log('Client connected to web', channel, bus.events.listenerCount(channel))
      res.sendFile(join(pubFolder, 'webhooks.html'))
    } else {
      next()
    }
  }, sse, (req, res) => {
    const { channel } = req.params

    function send(data) {
      res.json(data)
      keepAlive.reset()
    }

    function close() {
      bus.events.removeListener(channel, send)
      keepAlive.stop()
      log('Client disconnected', channel, bus.events.listenerCount(channel))
    }

    // Setup interval to ping every 30 seconds to keep the connection alive
    const keepAlive = new KeepAlive(() => res.json({}, 'ping'), 30 * 1000)
    keepAlive.start()

    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Listen for events on this channel
    bus.events.on(channel, send)

    // Clean up when the client disconnects
    res.on('close', close)

    res.json({}, 'ready')

    log('Client connected to sse', channel, bus.events.listenerCount(channel))
  })

  app.post('/:channel', async (req, res) => {
    // Emit an event to the Redis bus
    await bus.emitEvent({
      channel: req.params.channel,
      payload: {
        ...req.headers,
        body: req.body,
        query: req.query,
        timestamp: Date.now()
      }
    })

    res.status(200).end()
  })

  // Resend payload via the event emitter
  app.post('/:channel/redeliver', async (req, res) => {
    // Emit an event to the Redis bus
    await bus.emitEvent({
      channel: req.params.channel,
      payload: req.body
    })
    res.status(200).end()
  })

  if (process.env.SENTRY_DSN) {
    app.use(errorHandler())
  }

  return app
}
