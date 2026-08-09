import type {
  ChannelSecurity,
  UnaryCallRequest,
} from '@samuel.fabel/plugin-grpc-docs-common';
import { GrpcEngine } from '@samuel.fabel/plugin-grpc-docs-node';
import type { LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';

export interface RouterOptions {
  logger: LoggerService;
  engine?: GrpcEngine;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readTarget(body: Record<string, unknown>): string {
  const target = body.target;
  if (typeof target !== 'string' || !target.trim()) {
    throw new Error('Missing required string field "target"');
  }
  return target.trim();
}

function readSecurity(body: Record<string, unknown>): ChannelSecurity | undefined {
  const security = body.security;
  if (security === undefined) {
    return undefined;
  }
  if (security === 'insecure' || security === 'ssl') {
    return security;
  }
  throw new Error('Field "security" must be "insecure" or "ssl"');
}

export function createRouter(options: RouterOptions): express.Router {
  const { logger } = options;
  const engine = options.engine ?? new GrpcEngine();
  const router = Router();
  router.use(express.json({ limit: '2mb' }));

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.post('/call/unary', async (req, res) => {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Expected JSON object body' });
      return;
    }

    try {
      const target = readTarget(req.body);
      const service = req.body.service;
      const method = req.body.method;
      const payload = req.body.payload;

      if (typeof service !== 'string' || !service.trim()) {
        throw new Error('Missing required string field "service"');
      }
      if (typeof method !== 'string' || !method.trim()) {
        throw new Error('Missing required string field "method"');
      }
      if (!isRecord(payload)) {
        throw new Error('Missing required object field "payload"');
      }

      const request: UnaryCallRequest = {
        target,
        service: service.trim(),
        method: method.trim(),
        payload,
        security: readSecurity(req.body),
        metadata: isRecord(req.body.metadata)
          ? (req.body.metadata as UnaryCallRequest['metadata'])
          : undefined,
        timeoutMs:
          typeof req.body.timeoutMs === 'number' ? req.body.timeoutMs : 30_000,
      };

      const result = await engine.callUnary(request);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`call/unary failed: ${message}`);
      const status =
        typeof error === 'object' &&
        error &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'number'
          ? 502
          : 400;
      res.status(status).json({ error: message });
    }
  });

  return router;
}
