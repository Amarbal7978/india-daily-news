import { sql } from "@vercel/postgres";

export default async function handler(req, res) {

  if (req.method === "POST") {

    try {

      const { name, location, news } = req.body || {};

      if (!name || !location || !news) {
        return res.status(400).json({
          success: false,
          message: "Name, location and news are required."
        });
      }

      const result = await sql`
        INSERT INTO local_news
        (name, location, news, status)
        VALUES
        (${name}, ${location}, ${news}, 'pending')
        RETURNING id, name, location, news, status, created_at
      `;

      return res.status(201).json({
        success: true,
        message: "News submitted for verification.",
        submission: result.rows[0]
      });

    } catch (error) {

      console.error("LOCAL NEWS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Could not save local news."
      });
    }
  }


  if (req.method === "GET") {

    try {

      const result = await sql`
        SELECT
          id,
          name,
          location,
          news,
          status,
          created_at
        FROM local_news
        ORDER BY created_at DESC
      `;

      return res.status(200).json({
        success: true,
        submissions: result.rows
      });

    } catch (error) {

      console.error("FETCH LOCAL NEWS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Could not fetch local news."
      });
    }
  }


  return res.status(405).json({
    success: false,
    message: "Method not allowed"
  });
}