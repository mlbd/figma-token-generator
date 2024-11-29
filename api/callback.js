const https = require("https");

module.exports = async (req, res) => {
  if (req.method === "GET" && req.url.startsWith("/api/callback")) {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get("code");

    if (!code) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Authorization code is missing!" }));
      return;
    }

    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REDIRECT_URI = process.env.REDIRECT_URI;

    const postData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: code,
      grant_type: "authorization_code",
    }).toString();

    const options = {
      hostname: "www.figma.com",
      path: "/api/oauth/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          const responseData = JSON.parse(data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ access_token: responseData.access_token }));
        } else {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Failed to fetch access token",
              details: data,
            })
          );
        }
      });
    });

    request.on("error", (err) => {
      console.error("Request error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "Request failed", details: err.message })
      );
    });

    request.write(postData);
    request.end();
  } else {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};
