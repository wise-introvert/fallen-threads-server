import { Request, Response, NextFunction } from 'express'
import { get, isEmpty, omit } from 'lodash'
import { StatusCodes } from 'http-status-codes'
import { verify, JwtPayload } from 'jsonwebtoken'

import admin from '../config/admin'

const authenticate = async (
  req: Request & { user: Record<string, any> },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token: string = get(req, 'headers.authorization')
    const payload: string | JwtPayload = verify(token, process.env.JWT_SECRET)
    if (isEmpty(token) || isEmpty(payload)) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({
          success: false,
          data: {
            message: 'Forbidden',
          },
        })
        .end()
      next(null)
    } else {
      const username: string = get(payload, 'username')
      const user = await admin
        .firestore()
        .collection('user')
        .where('username', '==', username)
        .get()
      if (isEmpty(user)) {
        res
          .status(StatusCodes.FORBIDDEN)
          .json({
            success: false,
            data: {
              message: 'Forbidden',
            },
          })
          .end()
        next(null)
      } else {
        const userData = user.docs[0]
        req.user = {
          id: userData.id,
          ...omit(userData.data(), 'password'),
        }
        next()
      }
    }
  } catch (err) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json({
        success: false,
        data: {
          message: 'Forbidden',
          ...(process.env.NODE_ENV !== 'production' && {
            log: err.message,
          }),
        },
      })
      .end()
  }
}

export default authenticate
