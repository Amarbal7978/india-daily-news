export default async function handler(req, res) {
  try {
    const state = req.query.state || "Odisha";

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        state + " India"
      )}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: "State-wise news fetch karne mein problem hui."
    });
  }
}