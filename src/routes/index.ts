import { Router } from 'express'

import userRoute from './user'

const router: Router = Router()

router.use('/auth', userRoute)

export default router
