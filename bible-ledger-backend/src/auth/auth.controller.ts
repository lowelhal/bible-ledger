import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { auth } from './auth';
import { toNodeHandler } from 'better-auth/node';

@Controller('api/auth')
export class AuthController {
  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(auth);
    return handler(req, res);
  }
}
