import { Request, Response, Router } from 'express'

const router: Router = Router()

router.post(`/login`, (req: Request, res: Response) => {
  const { username, password } = req.body

  res
    .status(200)
    .json({
      username,
      password,
    })
    .end()
})

export default router
