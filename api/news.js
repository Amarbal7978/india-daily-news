import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    const state = req.query.state || "Odisha";

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        state + " India"
      )}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    if (data.articles) {
      for (const article of data.articles) {
        if (article.url) {
          await sql`
            INSERT INTO news
              (title, description, url, state, published_at)
            VALUES
              (
                ${article.title},
                ${article.description || ""},
                ${article.url},
                ${state},
                ${article.publishedAt || null}
              )
            ON CONFLICT (url) DO NOTHING
          `;
        }
      }
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "News save karne mein problem hui."
    });
  }
}