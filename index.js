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

async function checkVisited() {
  const result = await db.query( "SELECT country_code FROM visited_countries");
  let countries = [];

  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });

  return countries;
}

app.get("/", async (req, res) => {
  try {
    const countries = await checkVisited();
    res.render("index.ejs", { countries: countries, total: countries.length });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

app.post("/add", async (req, res) => {
  try {
    const input = req.body["country"];
    
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = LOWER($1)",
      [input]
    );

    if (result.rows.length !== 0) {
      const countryCode = result.rows[0].country_code;
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } else {
      res.status(400).send("Country not found");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});