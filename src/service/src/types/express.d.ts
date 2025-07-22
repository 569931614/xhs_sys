import { Request } from 'express';
import { AbortController } from 'abort-controller';

interface JwtPayload {
  username: string;
  client: string;
  id?: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      abortController?: AbortController;
    }
    interface Multer {
      File: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer?: Buffer;
      }
    }
  }
}
