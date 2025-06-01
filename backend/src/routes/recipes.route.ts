const express = require("express");
const {
  seedRecipes,
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require("../controllers/recipes.controller");

const router = express.Router();

router.get("/", getRecipes);

router.post("/seed", seedRecipes);
router.post("/createRecipe", createRecipe);

router.put("/updateRecipe/:id", updateRecipe);

router.delete("/deleteRecipe/:id", deleteRecipe);

export default router;
