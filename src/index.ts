import { Hono } from 'hono'
import timezoneRouter from './routes/timezone'
import { ipRouter } from './routes/ip'
import { HonoApp } from './types/api'

const app = new Hono<HonoApp>()

app.get('/', (c) => {
  return c.text('A world time API that actually works. Built with <3 by Sleeyax')
})
app.route('/api', timezoneRouter)
app.route('/api', ipRouter);

export default app
