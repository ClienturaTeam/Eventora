import * as dotenv from "dotenv";
dotenv.config();

import { app } from "./app";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;

app.listen(Number(PORT), HOST, () => {
  console.log(`[Server] Eventora API is running on http://${HOST}:${PORT}`);
});
