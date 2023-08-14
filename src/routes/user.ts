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
import * as yup from 'yup'

import admin from '../config/admin'

const router: Router = Router()
const db: Firestore = admin.firestore()
const newUserValidationSchema = yup.object({
  username: yup
    .string()
    .required()
    .min(6, 'username should have at least 6 characters')
    .max(32, 'username cannot be more than 32 characters long'),
  password: yup
    .string()
    .required()
    .min(8, 'password should be at least 8 characters long')
    .max(32, 'password should not be more than 32 characters long'),
  email: yup.string().email().required(),
  name: yup
    .string()
    .notRequired()
    .min(1, 'name should be at least 1 character long')
    .max(48, 'name cannot be more than 48 characters long'),
})
const loginInputValidation = yup.object({
  username: yup.string().required(),
  password: yup.string().required(),
})

router.post(`/signup`, async (req: Request, res: Response): Promise<void> => {
  try {
    await newUserValidationSchema.validate(req.body)
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      data: {
        message: err.message,
      },
    })
    return
  }
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
          ...(process.env.NODE_ENV !== 'production' && {
            username,
            email,
            name,
          }),
        },
      })
      .end()
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    await loginInputValidation.validate(req.body)
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      data: {
        message: err.message,
      },
    })
    return
  }

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
