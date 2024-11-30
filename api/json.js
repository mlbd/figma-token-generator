const https = require("https");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    // Extract the figma_url parameter from the query string
    const url = new URL(req.url, `https://${req.headers.host}`);
    const figmaUrl = url.searchParams.get("figma_url");

    if (!figmaUrl) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing figma_url parameter!" }));
    }

    // Extract the file key from the Figma design URL using a regular expression
    const fileKeyMatch = figmaUrl.match(/design\/([a-zA-Z0-9]+)/);

    if (!fileKeyMatch) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid Figma design link!" }));
    }

    const fileKey = fileKeyMatch[1];
    const FigmaAccessToken = process.env.FIGMA_ACCESS_TOKEN;

    if (!FigmaAccessToken) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ error: "Figma access token not configured!" })
      );
    }

    try {
      // Fetch Figma file details using the file key
      const options = {
        hostname: "api.figma.com",
        path: `/v1/files/${fileKey}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${FigmaAccessToken}`,
        },
      };

      const figmaData = await new Promise((resolve, reject) => {
        const figmaRequest = https.request(options, (response) => {
          let data = "";
          response.on("data", (chunk) => (data += chunk));
          response.on("end", () => resolve(JSON.parse(data)));
        });

        figmaRequest.on("error", (err) => reject(err));
        figmaRequest.end();
      });

      // figmaData.document.children.forEach((page) => {
      //   page.children.forEach((frame) => {
      //     frame.children.forEach((node) => {
      //       console.log(node);
      //     });
      //   });
      // });

      const themeJson = {
        version: 2,
        settings: {
          color: {
            palette: [],
          },
          typography: {
            fontSizes: [],
            fontFamilies: [],
          },
        },
        components: figmaData.components || {},
        componentSets: figmaData.componentSets || {},
        schemaVersion: figmaData.schemaVersion || 0,
      };

      // Recursive color extraction function
      const extractColors = (node) => {
        if (node.type === "RECTANGLE" && node.fills) {
          node.fills.forEach((fill) => {
            if (fill.type === "SOLID" && fill.color) {
              const color = `#${(
                (1 << 24) +
                (Math.round(fill.color.r * 255) << 16) +
                (Math.round(fill.color.g * 255) << 8) +
                Math.round(fill.color.b * 255)
              )
                .toString(16)
                .slice(1)}`;

              const colorName = node.name || "Unnamed";
              themeJson.settings.color.palette.push({
                name: colorName,
                slug: colorName.toLowerCase().replace(/\s+/g, "-"),
                color: color,
              });
            }
          });
        }

        if (node.children) {
          node.children.forEach((child) => extractColors(child));
        }
      };

      // Traverse the Figma document
      figmaData.document.children.forEach((page) => {
        if (page.children) {
          page.children.forEach((frame) => {
            if (frame.children) {
              frame.children.forEach((node) => extractColors(node));
            }
          });
        }
      });

      // Respond with the generated theme.json
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(themeJson, null, 2));
    } catch (error) {
      console.error("Error fetching Figma data:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ error: "Failed to process the Figma file." })
      );
    }
  } else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed!" }));
  }
};
