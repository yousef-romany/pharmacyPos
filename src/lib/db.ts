import Database from "tauri-plugin-sql-api";
let db: any;
try {
  if (typeof window !== "undefined") {
    db = Database?.load("mysql://root:root@localhost:3306/pharmacypos");
  }
} catch (error) {
  console.log("error in load dataBase");
  throw error;
}
export default db;