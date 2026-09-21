import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    const state = req.query.state || "Odisha";
    const category = req.query.category || "National";

    const categoryQueries = {
      National: `${state} India national news`,
      States: `${state} India latest news`,
      Education: `${state} India education schools colleges exams`,
      Jobs: `${state} India jobs recruitment vacancies government jobs`,
      Sports: `${state} India sports cricket football hockey`,
      "Events & Culture": `${state} India festivals culture mela events`
    };

    const searchQuery =
      categoryQueries[category] || `${state} India latest news`;
     const finalQuery =
  category === "Events & Culture"
    ? `"${state}" India festival culture events`
    : `"${state}" India ${category}`;
    const apiResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(finalQuery)
      }&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      return res.status(500).json({
        error: apiData.message || "NewsAPI error"
      });
    }

    if (apiData.articles) {
      for (const article of apiData.articles) {
        if (!article.url || !article.title) continue;

        await sql`
          INSERT INTO news
          (title, description, url, state, published_at, created_at, category)
          VALUES
          (
            ${article.title},
            ${article.description || ""},
            ${article.url},
            ${state},
            ${article.publishedAt || null},
            NOW(),
            ${category}
          )
          ON CONFLICT (state, category, url) DO NOTHING
        `;
      }
    }

    const savedNews = await sql`
      SELECT
        id,
        title,
        description,
        url,
        state,
        published_at,
        created_at,
        category
      FROM news
      WHERE state = ${state}
        AND category = ${category}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return res.status(200).json({
      articles: savedNews
    });

  } catch (error) {
    console.error("API Error:", error);

    return res.status(500).json({
      error: error.message || "Server mein problem hui."
    });
  }
}