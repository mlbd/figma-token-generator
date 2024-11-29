export default async function handler(req, res) {
  const CLIENT_ID = process.env.CLIENT_ID;
  const REDIRECT_URI = process.env.REDIRECT_URI;

  const figmaAuthUrl = `https://www.figma.com/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=file_read&state=someRandomState&response_type=code`;

  res.writeHead(302, { Location: figmaAuthUrl });
  res.end();
}
