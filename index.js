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

app.get("/", async (req, res) => {
  const result = await db.query( "SELECT country_code FROM visited_countries");
  let countries = [];

  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });

  console.log(result.rows);
  res.render( "index.ejs", { countries: countries, total: countries.length });
  db.end;
});

app.post("/add", async (req, res) => {
  // Get the country name from the form submission
  const countryName = req.body["country"]; // "country" matches the 'name' attribute in the HTML form input that submits the country name

  try {
    // Query the countries table to find the country code
    // Using LIKE with wildcards for flexible matching
    // $1 is a parameterized query to prevent SQL injection
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [input.toLowerCase()]
    );

    // If no country is found with that name
    if (result.rows.length === 0) {
      // If no country is found in the database matching the user's input
      // Render the index page with an error message
      res.render("index.ejs", { 
        countries: countries,
        total: countries.length,
        error: "Country not found. Please try again."
      });
    } else {
      // If a matching country was found:
      // Get the country_code from the first (and should be only) result
      const countryCode = result.rows[0].country_code;
      
      try {
        // Try to insert the country code into visited_countries table
        // Using parameterized query ($1) to prevent SQL injection
        // This will fail if this country code already exists in the table
        // due to the unique constraint on country_code
        await db.query(
          "INSERT INTO visited_countries (country_code) VALUES ($1)",
          [countryCode]
        );
        // If insert succeeds, redirect to homepage which will show updated map
        res.redirect("/");
      } catch (err) {
        // If insert fails (most likely because country was already visited)
        // Log the error for debugging
        console.log(err);
        // Render index page with duplicate country error message
        res.render("index.ejs", {
          countries: countries,
          total: countries.length,
          error: "Country has already been added, try again."
        });
      }
    }
  } catch (err) {
    // If the main database query fails, show generic error
    console.log(err);
    res.render("index.ejs", {
      countries: countries, 
      total: countries.length,
      error: "An error occurred. Please try again."
    });
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});