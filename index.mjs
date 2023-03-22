import dotenv from "dotenv";
import server from "./lib/server.mjs";
dotenv.config();

const app = server();
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Listening at http://localhost:" + port);
});
