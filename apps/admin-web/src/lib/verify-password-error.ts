/** Thrown when POST /auth/verify-password fails (wrong password, etc.). */
export class VerifyPasswordError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message)
    this.name = 'VerifyPasswordError'
  }

  get isInvalidPassword(): boolean {
    return this.httpStatus === 401
  }
}
