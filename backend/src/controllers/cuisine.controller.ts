const { pool } = require("../db");
import type { Request, Response } from "express";

export const getCuisine = async (req: Request, res: Response) => {
  try {
    const queryText = "SELECT * FROM cuisine ORDER BY name ASC";
    const [rows] = await pool.query(queryText);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
