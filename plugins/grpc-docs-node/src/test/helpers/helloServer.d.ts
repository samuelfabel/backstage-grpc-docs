export interface HelloServerOptions {
  /** Defaults to 127.0.0.1 */
  host?: string;
  /** Defaults to 0 (ephemeral). Use 50051 for the local playground. */
  port?: number;
  /** When true, SayHello requires `authorization: Bearer …` metadata. */
  requireAuth?: boolean;
}

export interface HelloServer {
  target: string;
  stop: () => Promise<void>;
}

export declare function startHelloServer(
  options?: HelloServerOptions,
): Promise<HelloServer>;

export declare const PROTO_PATH: string;
