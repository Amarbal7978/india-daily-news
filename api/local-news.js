export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { name, location, news } = req.body || {};

    if (!name || !location || !news) {
      return res.status(400).json({
        success: false,
        message: "Name, location and news are required."
      });
    }

    console.log("LOCAL NEWS:", {
      name,
      location,
      news
    });

    return res.status(200).json({
      success: true,
      message: "Local news received successfully."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
}