import * as dotenv from "dotenv";
dotenv.config();

import { app } from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Eventora API is running on http://localhost:${PORT}`);
});
