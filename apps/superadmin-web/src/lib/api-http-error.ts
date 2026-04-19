/** Thrown on non-OK API responses; includes status for step-up / permission UX. */
export class ApiHttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiHttpError'
  }
}
