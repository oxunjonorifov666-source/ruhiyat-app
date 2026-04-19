/** Thrown when POST /auth/verify-password fails. */
export class VerifyPasswordError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VerifyPasswordError'
  }
}
