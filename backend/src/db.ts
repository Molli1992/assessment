import { createPool } from "mysql2/promise";

export const pool = createPool({
  user: "root",
  password: "bCKMrjlyJMduJKaNsWDRJYftsNrEMrsF",
  host: "centerbeam.proxy.rlwy.net",
  port: 14560,
  database: "railway",
});
