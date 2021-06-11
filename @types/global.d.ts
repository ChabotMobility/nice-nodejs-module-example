declare namespace NodeJS {
  interface Process {
    env: {
      PORT: number;
      SITE_CODE: string;
      SITE_PASSWORD: string;
      HOSTNAME: string;
    };
  }
}
