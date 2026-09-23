import {
  createAdminSession,
  getAdminSession,
  deleteAdminSession
} from "../lib/admin-auth.js";

export default async function handler(req, res) {

  // ==============================
  // LOGIN
  // ==============================

  if (req.method === "POST") {

    try {

      const {
        username,
        password
      } = req.body || {};

      if (!username || !password) {

        return res.status(400).json({
          success: false,
          message: "Username and password are required."
        });

      }

      const usernameMatch =
  username === process.env.ADMIN_USERNAME;

const passwordMatch =
  password === process.env.ADMIN_PASSWORD;

console.log("ADMIN DEBUG:", {
  usernameMatch,
  passwordMatch,
  receivedUsernameLength: username?.length,
  envUsernameLength: process.env.ADMIN_USERNAME?.length,
  receivedPasswordLength: password?.length,
  envPasswordLength: process.env.ADMIN_PASSWORD?.length
});

if (!usernameMatch || !passwordMatch) {

        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials."
        });

      }

      const token =
        await createAdminSession(username);

      res.setHeader(
        "Set-Cookie",
        `admin_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`
      );

      return res.status(200).json({
        success: true,
        message: "Admin login successful."
      });

    } catch (error) {

      console.error("ADMIN LOGIN ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Admin login failed."
      });

    }
  }


  // ==============================
  // CHECK SESSION
  // ==============================

  if (req.method === "GET") {

    try {

      const session =
        await getAdminSession(req);

      if (!session) {

        return res.status(401).json({
          success: false,
          authenticated: false
        });

      }

      return res.status(200).json({
        success: true,
        authenticated: true
      });

    } catch (error) {

      console.error("ADMIN SESSION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Could not check admin session."
      });

    }
  }


  // ==============================
  // LOGOUT
  // ==============================

  if (req.method === "DELETE") {

    try {

      await deleteAdminSession(req);

      res.setHeader(
        "Set-Cookie",
        "admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
      );

      return res.status(200).json({
        success: true,
        message: "Admin logged out."
      });

    } catch (error) {

      console.error("ADMIN LOGOUT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed."
      });

    }
  }


  return res.status(405).json({
    success: false,
    message: "Method not allowed"
  });

}