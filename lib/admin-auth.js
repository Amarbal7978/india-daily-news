import crypto from "crypto";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function parseCookies(req) {
  const header = req.headers.cookie || "";

  const cookies = {};

  header.split(";").forEach(part => {
    const index = part.indexOf("=");

    if (index === -1) return;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    cookies[key] = decodeURIComponent(value);
  });

  return cookies;
}

export async function createAdminSession(username) {

  const adminResult = await pool.query(
    `
    INSERT INTO admin_users
    (username, password_hash)
    VALUES ($1, $2)
    ON CONFLICT (username)
    DO UPDATE SET username = EXCLUDED.username
    RETURNING id
    `,
    [
      username,
      "managed-by-environment"
    ]
  );

  const adminId = adminResult.rows[0].id;

  const token = createSessionToken();
  const tokenHash = hashToken(token);

  await pool.query(
    `
    INSERT INTO admin_sessions
    (admin_id, token_hash, expires_at)
    VALUES
    ($1, $2, NOW() + INTERVAL '8 hours')
    `,
    [adminId, tokenHash]
  );

  return token;
}

export async function getAdminSession(req) {

  const cookies = parseCookies(req);

  const token = cookies.admin_session;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const result = await pool.query(
    `
    SELECT
      id,
      admin_id,
      expires_at
    FROM admin_sessions
    WHERE token_hash = $1
      AND expires_at > NOW()
    LIMIT 1
    `,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function deleteAdminSession(req) {

  const cookies = parseCookies(req);

  const token = cookies.admin_session;

  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);

  await pool.query(
    `
    DELETE FROM admin_sessions
    WHERE token_hash = $1
    `,
    [tokenHash]
  );
}