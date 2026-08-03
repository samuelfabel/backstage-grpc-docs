export interface Config {
  app: {
    /**
     * The title of the app, as shown in the Backstage web interface.
     *
     * @visibility frontend
     */
    title: string;

    /**
     * Frontend root URL.
     *
     * @visibility frontend
     */
    baseUrl: string;
  };
}
