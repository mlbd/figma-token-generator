import axios from "axios";

export default async function handler(req, res) {
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI;

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is missing!" });
  }

  try {
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
    res.status(200).json({ access_token });
  } catch (error) {
    console.error(
      "Error fetching access token:",
      error.response?.data || error
    );
    res.status(500).json({ error: "Failed to fetch access token." });
  }
}
