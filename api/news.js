import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    const state = req.query.state || "Odisha";
    const category = req.query.category || "National";

    const categoryQueries = {
  National: "India national news",

  States: `${state} India latest news`,

  Education: `${state} India education schools colleges exams`,

  Jobs: `${state} India jobs recruitment vacancies government jobs`,

  Sports: `${state} India sports cricket football hockey`,

  "Events & Culture": `${state} India festival cultural events mela celebration`
};

    const searchQuery =
      categoryQueries[category] || "India national news";

    // नई news API से लाना
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        searchQuery
      )}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    // News को database में save करना
    if (data.articles) {
      for (const article of data.articles) {
        await sql`
          INSERT INTO news
            (title, description, url, state, published_at, created_at, category)
          VALUES
            (
              ${article.title},
              ${article.description || ""},
              ${article.url},
              ${state},
              ${article.publishedAt},
              NOW(),
              ${category}
            )
          ON CONFLICT (url) DO NOTHING
        `;
      }
    }

    // Database से पुरानी और नई news निकालना
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
      WHERE category = ${category}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    res.status(200).json({
      articles: savedNews
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "News fetch aur save karne mein problem hui."
    });
  }
}