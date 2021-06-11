module.exports = {
  apps: [
    {
      name: "NiceAuthorizationService",
      script: "node -r dotenv/config dist/app.js",
      watch: false,
    },
  ],
};
