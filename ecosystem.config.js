module.exports = {
  apps: [
    {
      app: "NiceAuthorizationService",
      script: "node -r dotenv/config dist/app.js",
      watch: false,
    },
  ],
};
