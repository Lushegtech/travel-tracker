import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "globe",
  password: "@Caro07033",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET home page
app.get("/", async (req, res) => {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  // Here 'country' is just used as a parameter name in the forEach callback function
  // It could have been named anything like 'row' or 'code' since we're just accessing
  // the country_code property from each row object returned by the query
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(result.rows);
  res.render("index.ejs", { countries: countries, total: countries.length });
  db.end();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
