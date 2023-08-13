import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import * as logger from 'morgan'
import * as path from 'path'
import { Response } from 'express'

const app: express.Express = express()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '../../src/public')))

app.get('/', (_, res: Response<{ message: string }>) => {
  res
    .status(200)
    .json({
      message: 'hello',
    })
    .end()
})

app.listen(3000, () => {
  console.log('server started on port 3000')
})
