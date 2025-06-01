const express = require("express");
const { getCuisine } = require("../controllers/cuisine.controller");

const router = express.Router();

router.get("/", getCuisine);

export default router;