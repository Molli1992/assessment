import { createPool } from "mysql2/promise";

export const pool = createPool({
  user: "root",
  password: "eouwtCpSuAMluJYWSxlcfJuhbWsYIxEA",
  host: "switchyard.proxy.rlwy.net",
  port: 45796,
  database: "railway",
});
