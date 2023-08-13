import 'dotenv/config'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import * as logger from 'morgan'

import routes from './routes'
import admin from './config/admin'

const app: express.Express = express()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use('/api', routes)

app.get('/api/health', async (_, res: express.Response): Promise<void> => {
  try {
    await admin.firestore().collection('health').get()
    res
      .status(200)
      .json({
        status: 'healthy',
      })
      .end()
  } catch (err) {
    res
      .status(500)
      .json({
        error: err.message,
        status: 'sick',
      })
      .end()
  }
})

app.get('/*', (_, res: express.Response<{ error: string }>) => {
  res
    .status(404)
    .json({
      error: 'Not Found',
    })
    .end()
})

app.listen(3000, () => {
  console.log('server started on port 3000')
})
