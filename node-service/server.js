
const { createApp } = require("./src/app");

const PORT = process.env.PORT || 3000;

const server = createApp();

server.listen(PORT, () => {
  console.log(`Node.js server is running on http://localhost:${PORT}`);
});
