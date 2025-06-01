const express = require("express");
const cors = require("cors");
import recipesRoute from "./routes/recipes.route";
const app = express();

const PORT: number = 3001;
const corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/recipes", recipesRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
