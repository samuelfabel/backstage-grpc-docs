export interface Config {
  /**
   * Configuration for the grpc-docs plugin.
   */
  grpcDocs?: {
    /**
     * Deny-by-default target access rules (evaluated in order).
     * First matching rule wins; identity must appear in `allow`.
     *
     * @visibility backend
     */
    targetAccess?: Array<{
      /**
       * Match against the call target host or host:port.
       *
       * @visibility backend
       */
      match: {
        /**
         * `wildcard` | `dns` | `regex` | `ip` | `cidr`
         *
         * @visibility backend
         */
        type: 'wildcard' | 'dns' | 'regex' | 'ip' | 'cidr';
        /**
         * Pattern value for the chosen match type.
         *
         * @visibility backend
         */
        value: string;
      };
      /**
       * Entity refs (`user:` / `group:`) allowed to call matching targets.
       *
       * @visibility backend
       */
      allow: string[];
    }>;
  };
}
