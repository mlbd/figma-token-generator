const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Replace with your Figma App credentials
const CLIENT_ID = "u85qAMHCbhYiL4GBldp95I";
const CLIENT_SECRET = "8OCN6QhE58xQeheUjnKjV65in2ual4";
const REDIRECT_URI = "http://localhost:3000/callback";

app.use(bodyParser.urlencoded({ extended: true }));

// Step 1: Redirect to Figma Authorization Page
app.get("/auth", (req, res) => {
  const figmaAuthUrl = `https://www.figma.com/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=file_read&state=someRandomState&response_type=code`;
  res.redirect(figmaAuthUrl);
});

// Step 2: Handle Callback and Exchange Code for Access Token
app.get("/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code is missing!");
  }

  try {
    // Exchange code for access token
    const response = await axios.post(
      "https://www.figma.com/api/oauth/token",
      null,
      {
        params: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code,
          grant_type: "authorization_code",
        },
      }
    );

    const { access_token } = response.data;
    res.send(`Access Token: ${access_token}`);
  } catch (error) {
    console.error("Error fetching access token:", error.response.data);
    res.status(500).send("Failed to fetch access token.");
  }
});

// Step 3: Start the Server
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
  console.log(`Start authentication by visiting http://localhost:${port}/auth`);
});
