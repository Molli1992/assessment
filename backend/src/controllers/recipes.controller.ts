const { pool } = require("../db");
const fs = require("fs");
const path = require("path");
import type { Request, Response } from "express";

const jsonPath = path.resolve("data.json");
const rawData = fs.readFileSync(jsonPath, "utf-8");
const { recipes } = JSON.parse(rawData);

export const seedRecipes = async (req: Request, res: Response) => {
  try {
    for (const recipe of recipes) {
      const {
        title,
        cuisine,
        difficulty,
        cookTime,
        servings,
        image,
        rating,
        ingredients,
        description,
      } = recipe;

      await pool.query(
        `INSERT INTO recipes 
    (title, cuisine, difficulty, cookTime, servings, image, rating, ingredients, description)
   VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          cuisine,
          difficulty,
          cookTime,
          servings,
          image,
          rating,
          JSON.stringify(ingredients),
          description,
        ]
      );
    }

    res.status(200).json({ message: "Recipes inserted correctly." });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error.",
      error: error,
    });
  }
};

export const getRecipes = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 6,
      title,
      cuisine,
      difficulty,
      cookTime,
      ingredients,
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (isNaN(pageNum)) {
      return res
        .status(400)
        .json({ message: "Parameter 'page' must be a valid number." });
    }

    if (!Number.isInteger(pageNum)) {
      return res
        .status(400)
        .json({ message: "Parameter 'page' must be an integer." });
    }

    if (pageNum <= 0) {
      return res
        .status(400)
        .json({ message: "Parameter 'page' must be greater than 0." });
    }

    if (isNaN(limitNum)) {
      return res
        .status(400)
        .json({ message: "Parameter 'limit' must be a valid number." });
    }

    if (!Number.isInteger(limitNum)) {
      return res
        .status(400)
        .json({ message: "Parameter 'limit' must be an integer." });
    }

    if (limitNum <= 0) {
      return res
        .status(400)
        .json({ message: "Parameter 'limit' must be greater than 0." });
    }

    const offset = (Number(page) - 1) * Number(limit);

    const filters: string[] = [];
    const values: any[] = [];

    if (title) {
      filters.push(`title LIKE ?`);
      values.push(`%${title}%`);
    }

    if (cuisine) {
      filters.push(`cuisine = ?`);
      values.push(cuisine);
    }

    if (difficulty) {
      filters.push(`difficulty = ?`);
      values.push(difficulty);
    }

    if (cookTime) {
      filters.push(`cookTime = ?`);
      values.push(cookTime);
    }

    if (ingredients) {
      const ingredientList = (ingredients as string)
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i !== "");

      if (ingredientList.length) {
        const ingredientFilters = ingredientList
          .map(() => `ingredients LIKE ?`)
          .join(" AND ");
        filters.push(ingredientFilters);
        ingredientList.forEach((i) => values.push(`%${i}%`));
      }
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT * FROM recipes ${whereClause} LIMIT ? OFFSET ?`,
      [...values, Number(limit), offset]
    );

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recipes", error });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ message: "The body of the request is missing." });
    }

    const {
      title,
      cuisine,
      difficulty,
      cookTime,
      servings,
      image,
      rating,
      ingredients,
      description,
    } = req.body;

    const requiredFields = [
      "title",
      "cuisine",
      "difficulty",
      "cookTime",
      "servings",
      "image",
      "rating",
      "ingredients",
      "description",
    ];

    const missingFields = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    if (typeof title !== "string") {
      return res.status(400).json({ message: "'title' must be a string." });
    }

    const cuisineMap: { [key: number]: string } = {
      1: "Italian",
      2: "Indian",
      3: "American",
      4: "Mexican",
      5: "Thai",
      6: "Greek",
      7: "Japanese",
      8: "British",
      9: "Moroccan",
      10: "Korean",
      11: "French",
    };

    if (!cuisineMap[cuisine]) {
      return res.status(400).json({
        message: `'cuisine' must be an integer between 1 and 11, corresponding to a valid cuisine.`,
        validCuisines: cuisineMap,
      });
    }

    if (typeof difficulty !== "string") {
      return res
        .status(400)
        .json({ message: "'difficulty' must be a string." });
    }

    const allowedDifficulties = ["Easy", "Medium", "Hard"];
    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({
        message: `'difficulty' must be one of ${allowedDifficulties.join(
          ", "
        )}.`,
      });
    }

    if (typeof cookTime !== "number" || isNaN(cookTime)) {
      return res.status(400).json({ message: "'cookTime' must be a number." });
    }

    if (typeof servings !== "number" || isNaN(servings)) {
      return res.status(400).json({ message: "'servings' must be a number." });
    }

    if (typeof image !== "string") {
      return res
        .status(400)
        .json({ message: "'image' must be a string (URL)." });
    }

    if (typeof rating !== "number" || isNaN(rating)) {
      return res.status(400).json({ message: "'rating' must be a number." });
    }

    if (!Array.isArray(ingredients)) {
      return res
        .status(400)
        .json({ message: "'ingredients' must be an array." });
    }

    if (ingredients.length === 0) {
      return res
        .status(400)
        .json({ message: "'ingredients' cannot be an empty array." });
    }

    if (!ingredients.every((item: any) => typeof item === "string")) {
      return res
        .status(400)
        .json({ message: "Every ingredient must be a string." });
    }

    if (typeof description !== "string") {
      return res
        .status(400)
        .json({ message: "'description' must be a string." });
    }

    const [result] = await pool.query(
      `INSERT INTO recipes 
      (title, cuisine, difficulty, cookTime, servings, image, rating, ingredients, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        cuisine,
        difficulty,
        cookTime,
        servings,
        image,
        rating,
        JSON.stringify(ingredients),
        description,
      ]
    );

    const insertedId = (result as any).insertId;
    const [rows] = await pool.query(`SELECT * FROM recipes WHERE id = ?`, [
      insertedId,
    ]);
    const insertedRecipe =
      Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!insertedRecipe) {
      return res
        .status(500)
        .json({ message: "Error creating recipe", data: insertedRecipe });
    }

    res
      .status(201)
      .json({ message: "Recipe created successfully", data: insertedRecipe });
  } catch (error) {
    res.status(500).json({ message: "Error creating recipe", error });
  }
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "The id parameter is missing." });
    }

    if (!req.body) {
      return res
        .status(400)
        .json({ message: "The body of the request is missing." });
    }

    const [existingRecipe] = await pool.query(
      `SELECT * FROM recipes WHERE id = ?`,
      [id]
    );

    if (
      !existingRecipe ||
      (Array.isArray(existingRecipe) && existingRecipe.length === 0)
    ) {
      return res
        .status(404)
        .json({ message: `Recipe with id ${id} not found.` });
    }

    const {
      title,
      cuisine,
      difficulty,
      cookTime,
      servings,
      image,
      rating,
      ingredients,
      description,
    } = req.body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      if (typeof title !== "string")
        return res.status(400).json({ message: "'title' must be a string." });
      fieldsToUpdate.push("title = ?");
      values.push(title);
    }

    if (cuisine !== undefined) {
      const cuisineMap: { [key: number]: string } = {
        1: "Italian",
        2: "Indian",
        3: "American",
        4: "Mexican",
        5: "Thai",
        6: "Greek",
        7: "Japanese",
        8: "British",
        9: "Moroccan",
        10: "Korean",
        11: "French",
      };

      if (!cuisineMap[cuisine]) {
        return res.status(400).json({
          message: `'cuisine' must be an integer between 1 and 11, corresponding to a valid cuisine.`,
          validCuisines: cuisineMap,
        });
      }

      fieldsToUpdate.push("cuisine = ?");
      values.push(cuisine);
    }

    if (difficulty !== undefined) {
      if (typeof difficulty !== "string")
        return res
          .status(400)
          .json({ message: "'difficulty' must be a string." });

      const allowedDifficulties = ["Easy", "Medium", "Hard"];
      if (!allowedDifficulties.includes(difficulty)) {
        return res.status(400).json({
          message: `'difficulty' must be one of ${allowedDifficulties.join(
            ", "
          )}.`,
        });
      }

      fieldsToUpdate.push("difficulty = ?");
      values.push(difficulty);
    }

    if (cookTime !== undefined) {
      if (typeof cookTime !== "number" || isNaN(cookTime))
        return res
          .status(400)
          .json({ message: "'cookTime' must be a number." });
      fieldsToUpdate.push("cookTime = ?");
      values.push(cookTime);
    }

    if (servings !== undefined) {
      if (typeof servings !== "number" || isNaN(servings))
        return res
          .status(400)
          .json({ message: "'servings' must be a number." });
      fieldsToUpdate.push("servings = ?");
      values.push(servings);
    }

    if (image !== undefined) {
      if (typeof image !== "string")
        return res
          .status(400)
          .json({ message: "'image' must be a string (URL)." });
      fieldsToUpdate.push("image = ?");
      values.push(image);
    }

    if (rating !== undefined) {
      if (typeof rating !== "number" || isNaN(rating))
        return res.status(400).json({ message: "'rating' must be a number." });
      fieldsToUpdate.push("rating = ?");
      values.push(rating);
    }

    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients))
        return res
          .status(400)
          .json({ message: "'ingredients' must be an array." });

      if (ingredients.length === 0)
        return res
          .status(400)
          .json({ message: "'ingredients' cannot be an empty array." });

      if (!ingredients.every((item: any) => typeof item === "string"))
        return res
          .status(400)
          .json({ message: "Every ingredient must be a string." });

      fieldsToUpdate.push("ingredients = ?");
      values.push(JSON.stringify(ingredients));
    }

    if (description !== undefined) {
      if (typeof description !== "string")
        return res
          .status(400)
          .json({ message: "'description' must be a string." });
      fieldsToUpdate.push("description = ?");
      values.push(description);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: "There is no data to update." });
    }

    const updateQuery = `UPDATE recipes SET ${fieldsToUpdate.join(
      ", "
    )} WHERE id = ?`;
    values.push(id);

    const [result]: any = await pool.query(updateQuery, values);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: `No recipe found with id ${id}.` });
    }

    const [updatedRecipe] = await pool.query(
      `SELECT * FROM recipes WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      message: "Recipe updated successfully",
      data: updatedRecipe[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating recipe", error });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "The id parameter is missing." });
    }

    const [existingRecipe] = await pool.query(
      `SELECT * FROM recipes WHERE id = ?`,
      [id]
    );

    if (
      !existingRecipe ||
      (Array.isArray(existingRecipe) && existingRecipe.length === 0)
    ) {
      return res
        .status(404)
        .json({ message: `Recipe with id ${id} not found.` });
    }

    const [result]: any = await pool.query(`DELETE FROM recipes WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: `No recipe found with id ${id}.` });
    }

    res.status(200).json({
      message: "Recipe deleted successfully",
      deletedRecipe: existingRecipe[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recipe", error });
  }
};
