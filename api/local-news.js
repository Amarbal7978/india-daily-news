import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {

  // =====================================================
  // USER SUBMITS LOCAL NEWS
  // =====================================================

  if (req.method === "POST") {

    try {

      const {
        name,
        phone,
        email,
        village,
        block,
        district,
        state,
        title,
        category,
        event_at,
        description,
        location,
        news,
        media_url,
        media_type
      } = req.body || {};


      if (!name || !title || !description) {
        return res.status(400).json({
          success: false,
          message: "Name, title and description are required."
        });
      }


      // Backward compatibility with old form
      const finalLocation =
        location ||
        [village, block, district, state]
          .filter(Boolean)
          .join(", ");


      const finalNews =
        news ||
        `${title}\n\n${description}`;


      // -------------------------------------------------
      // DUPLICATE CHECK
      // -------------------------------------------------

      const duplicateCheck = await pool.query(
        `
        SELECT id
        FROM local_news
        WHERE
          LOWER(title) = LOWER($1)
          AND LOWER(location) = LOWER($2)
          AND created_at > NOW() - INTERVAL '24 hours'
        LIMIT 1
        `,
        [title, finalLocation]
      );


      if (duplicateCheck.rows.length > 0) {

        return res.status(409).json({
          success: false,
          message:
            "A similar local news report was already submitted recently."
        });

      }


      // -------------------------------------------------
      // SAVE AS PENDING
      // -------------------------------------------------

      const result = await pool.query(
        `
        INSERT INTO local_news
        (
          name,
          phone,
          email,
          village,
          block,
          district,
          state,
          title,
          category,
          event_at,
          description,
          location,
          news,
          media_url,
          media_type,
          status
        )
        VALUES
        (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15,
          'pending'
        )
        RETURNING
          id,
          name,
          location,
          title,
          status,
          created_at
        `,
        [
          name,
          phone || null,
          email || null,
          village || null,
          block || null,
          district || null,
          state || null,
          title,
          category || null,
          event_at || null,
          description,
          finalLocation,
          finalNews,
          media_url || null,
          media_type || null
        ]
      );


      return res.status(201).json({
        success: true,
        message: "News submitted for verification.",
        submission: result.rows[0]
      });


    } catch (error) {

      console.error("LOCAL NEWS POST ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Could not save local news."
      });

    }
  }


  // =====================================================
  // ADMIN: GET SUBMISSIONS
  // =====================================================

  if (req.method === "GET") {

    try {

      const result = await pool.query(
        `
        SELECT
          id,
          name,
          phone,
          email,
          village,
          block,
          district,
          state,
          title,
          category,
          event_at,
          description,
          location,
          news,
          media_url,
          media_type,
          status,
          verification_notes,
          rejection_reason,
          verified_at,
          verified_by,
          created_at
        FROM local_news
        ORDER BY created_at DESC
        `
      );


      return res.status(200).json({
        success: true,
        submissions: result.rows
      });


    } catch (error) {

      console.error("LOCAL NEWS GET ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Could not fetch local news."
      });

    }
  }


  // =====================================================
  // ADMIN: VERIFY NEWS
  // =====================================================

  if (req.method === "PATCH") {

    try {

      const {
        id,
        action,
        admin,
        verification_notes,
        rejection_reason
      } = req.body || {};


      if (!id || !action) {

        return res.status(400).json({
          success: false,
          message: "Submission ID and action are required."
        });

      }


      if (action === "verify") {

        const result = await pool.query(
          `
          UPDATE local_news
          SET
            status = 'verified',
            verification_notes = $1,
            verified_at = NOW(),
            verified_by = $2
          WHERE id = $3
            AND status = 'pending'
          RETURNING
            id,
            title,
            status,
            verified_at,
            verified_by
          `,
          [
            verification_notes || null,
            admin || "admin",
            id
          ]
        );


        if (result.rows.length === 0) {

          return res.status(409).json({
            success: false,
            message:
              "Report not found or it is no longer pending."
          });

        }


        return res.status(200).json({
          success: true,
          message: "News verified successfully.",
          submission: result.rows[0]
        });

      }


      if (action === "reject") {

        if (!rejection_reason) {

          return res.status(400).json({
            success: false,
            message: "Rejection reason is required."
          });

        }


        const result = await pool.query(
          `
          UPDATE local_news
          SET
            status = 'rejected',
            rejection_reason = $1,
            verification_notes = $2,
            verified_at = NOW(),
            verified_by = $3
          WHERE id = $4
            AND status = 'pending'
          RETURNING
            id,
            title,
            status,
            rejection_reason,
            verified_at,
            verified_by
          `,
          [
            rejection_reason,
            verification_notes || null,
            admin || "admin",
            id
          ]
        );


        if (result.rows.length === 0) {

          return res.status(409).json({
            success: false,
            message:
              "Report not found or it is no longer pending."
          });

        }


        return res.status(200).json({
          success: true,
          message: "News rejected successfully.",
          submission: result.rows[0]
        });

      }


      return res.status(400).json({
        success: false,
        message: "Invalid action."
      });


    } catch (error) {

      console.error("LOCAL NEWS PATCH ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Could not update news status."
      });

    }
  }


  // =====================================================
  // PUBLIC: ONLY VERIFIED NEWS
  // =====================================================

  if (req.method === "OPTIONS") {

    return res.status(200).json({
      success: true
    });

  }


  return res.status(405).json({
    success: false,
    message: "Method not allowed"
  });

}