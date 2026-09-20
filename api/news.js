export default async function handler(req, res) {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=India&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: "News fetch karne mein problem hui."
    });
  }
}