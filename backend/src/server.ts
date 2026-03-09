import { config } from "dotenv";
import app from "./app";

config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Golden Media backend listening on http://localhost:${PORT}`);
});
