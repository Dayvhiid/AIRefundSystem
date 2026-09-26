import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_ERROR'

  res.status(statusCode).json({
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
    },
  })
}

export function createError(statusCode: number, code: string, message: string): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  err.code = code
  return err
}
