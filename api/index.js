// api/index.js

module.exports = (req, res) => {
  const REDIRECT_URI = process.env.REDIRECT_URI;
  res
    .status(200)
    .send(
      "404: Lost route—probably chasing squirrels. redirect_uri: " +
        REDIRECT_URI
    );
};
