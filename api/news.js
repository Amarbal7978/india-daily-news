import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    const state = req.query.state || "Odisha";
    const language = req.query.language || "English";
    const category = req.query.category || "";
const languageCodes = {
  English: "en",
  Hindi: "hi",
  Odia: "en"
};

const apiLanguage = languageCodes[language] || "en";
const categoryQueries = {
  National: "India",
  States: `${state} India`,
  Education: "India education",
  Jobs: "India jobs",
  Sports: "India sports",
  "Events & Culture": "India events culture festivals"
};

const searchQuery = categoryQueries[category] || `${state} India`;
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        searchQuery
      )}&language=${apiLanguage}&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
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

    const savedNews = await sql`
  SELECT
    title,
    description,
    url,
    published_at AS "publishedAt"
  FROM news
  WHERE state = ${state}
  ORDER BY created_at DESC
  LIMIT 50
`;

res.status(200).json({
  status: "ok",
  articles: savedNews
});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "News save karne mein problem hui."
    });
  }
}