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
  const input = req.body["country"]; // "country" matches the 'name' attribute in the HTML form input that submits the country name

  try {
    // Query the countries table to find the country code
    // Using LIKE with wildcards for flexible matching 
    // The LIKE operator with wildcards is used in the database query below:
    // If user types "united", the query "... LIKE '%united%'" will:
    // 1. Match "United States" because "united" appears in the middle
    // 2. Match "United Kingdom" because "united" appears in the middle
    // The % symbols mean "match any characters before/after the search term"
    // For example: 'united' would match 'United States', 'United Kingdom', etc.
    // The % symbols before and after match any characters in those positions
    // $1 is a parameterized query to prevent SQL injection
    const result = await db.query(
      "SELECT country_code FROM countries WHERE country_name LIKE '%' || $1 || '%'",
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
      // If a matching country was found in the database:
      // 1. Get the first result from the query (result.rows[0])
      // 2. Extract just the country_code field from that result
      // 3. This code will be used to:
      //    - Insert into visited_countries table
      //    - Color the country on the world map when rendered
      const countryCode = result.rows[0].country_code;
      try {
        // Attempt to insert the country code into visited_countries table
        // This may fail if the country is already in the table (duplicate)
        await db.query(
          // Insert the country code into visited_countries table
          // $1 is replaced with countryCode parameter to safely insert the value
          // This query adds a new row with the country_code from the countries table
          "INSERT INTO visited_countries (country_code) VALUES ($1)",
          [countryCode] // The countryCode value is passed as an array parameter to safely insert into the SQL query.
                       // This prevents SQL injection by using parameterized queries where $1 in the query is replaced
                       // with this sanitized value
        );
        // If successful, redirect to homepage to see updated map
        res.redirect("/");
      } catch (err) {
        // If insert fails (likely due to duplicate), show error
        console.log(err);
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