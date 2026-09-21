export default async function handler(req, res) {
  try {
    const state = req.query.state || "Odisha";
    const language = req.query.language || "English";
    const category = req.query.category || "National";

    const languageCodes = {
      English: "en",
      Hindi: "hi",
      Odia: "en"
    };

    const apiLanguage = languageCodes[language] || "en";

    const categoryQueries = {
      National: "India national news",
      States: `${state} India news`,
      Education: "India education schools colleges exams",
      Jobs: "India jobs recruitment vacancies government jobs",
      Sports: "India sports cricket football hockey",
      "Events & Culture": 'India (festival OR cultural OR events OR mela OR celebration)'
    };

    const searchQuery =
      categoryQueries[category] || "India national news";

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        searchQuery
      )}&language=${apiLanguage}&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: "News fetch karne mein problem hui."
    });
  }
}