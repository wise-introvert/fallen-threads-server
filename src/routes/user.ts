import { Request, Response, Router } from 'express'
import { StatusCodes } from 'http-status-codes'
import { hashSync, compareSync } from 'bcryptjs'
import {
  Firestore,
  QuerySnapshot,
  DocumentReference,
  Filter,
} from 'firebase-admin/firestore'
import { sign } from 'jsonwebtoken'

import admin from '../config/admin'

const router: Router = Router()
const db: Firestore = admin.firestore()

router.post(`/signup`, async (req: Request, res: Response): Promise<void> => {
  const { username, password, email, name } = req.body

  const existing: QuerySnapshot = await db
    .collection('user')
    .where(
      Filter.or(
        Filter.where('username', '==', username),
        Filter.where('email', '==', email),
      ),
    )
    .get()

  if (!existing.empty) {
    res
      .status(StatusCodes.CONFLICT)
      .json({
        success: false,
        data: {
          message: 'Invalid username/password.',
        },
      })
      .end()
  } else {
    const hashedPassword: string = hashSync(password, 12)

    let user: DocumentReference = await db.collection('user').add({
      username,
      password: hashedPassword,
      createdAt: new Date().getTime(),
      email,
      name,
    })

    res
      .status(StatusCodes.OK)
      .json({
        success: true,
        data: {
          id: user.id,
        },
      })
      .end()
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body

  const user = await db
    .collection('user')
    .where('username', '==', username)
    .get()

  if (user.empty) {
    res
      .status(StatusCodes.NOT_FOUND)
      .json({
        success: false,
        data: {
          message: 'Invalid username/password',
        },
      })
      .end()
  } else {
    const userData = user.docs[0].data()
    const userId: string = user.docs[0].id
    const isPasswordValid: boolean = compareSync(password, userData.password)

    if (!isPasswordValid) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({
          success: false,
          data: {
            message: 'Invalid username/password',
          },
        })
        .end()
    } else {
      const payload = {
        username: userData.username,
        email: userData.email,
        id: userId,
      }

      const token: string = sign(payload, process.env.JWT_SECRET)

      res
        .status(StatusCodes.OK)
        .json({
          success: true,
          data: {
            ...payload,
            token,
          },
        })
        .end()
    }
  }
})

export default router
