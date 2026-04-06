const dotenv = require("dotenv");

dotenv.config();

const { PORT } = require("./config/env");
const { createApp } = require("./app");

const app = createApp();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
