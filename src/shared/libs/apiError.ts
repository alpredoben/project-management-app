export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 500, code = 'API_ERROR') {
    super(message);
    this.name = 'AppApiError';
    this.status = status;
    this.code = code;
  }
}