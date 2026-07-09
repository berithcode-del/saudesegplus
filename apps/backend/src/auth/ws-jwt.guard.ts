import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as crypto from 'crypto';
import { getJwtSecret } from './jwt-secret';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers.authorization as string | undefined)?.split(' ')[1];

    if (!token) {
      this.logger.warn(`[WsJwtGuard] Client ${client.id} without token`);
      throw new WsException('Unauthorized');
    }

    try {
      const payload = WsJwtGuard.verifyToken(token);
      client.data.user = payload;
      return true;
    } catch {
      this.logger.warn(`[WsJwtGuard] Invalid token from client ${client.id}`);
      throw new WsException('Unauthorized');
    }
  }

  private static verifyToken(token: string): Record<string, unknown> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');

    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      throw new Error('Invalid signature');
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Expired token');
    }
    if (typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') {
      throw new Error('Invalid token payload');
    }

    return decoded as Record<string, unknown>;
  }
}
