export default async function handler(req, res) {
  const repo = process.env.GITHUB_REPO || "sll521000/-";
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.GITHUB_GROWTH_PATH || "data/growth.vault.json";
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(503).json({ error: "GITHUB_TOKEN is not configured" });
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" };
  const endpoint = `https://api.github.com/repos/${repo}/contents/${path}`;
  try {
    if (req.method === "GET") {
      const response = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers });
      if (!response.ok) return res.status(response.status).json({ error: "vault not found" });
      const file = await response.json();
      const decoded = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
      return res.status(200).json({ vault: JSON.parse(decoded), sha: file.sha });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
    const vault = req.body?.vault;
    if (!vault?.data || !vault?.iv) return res.status(400).json({ error: "invalid vault" });
    let sha;
    const existing = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers });
    if (existing.ok) sha = (await existing.json()).sha;
    const body = { message: "Update encrypted growth vault", content: Buffer.from(JSON.stringify({ vault }, null, 2)).toString("base64"), branch };
    if (sha) body.sha = sha;
    const response = await fetch(endpoint, { method: "PUT", headers, body: JSON.stringify(body) });
    if (!response.ok) return res.status(response.status).json({ error: await response.text() });
    return res.status(200).json({ ok: true });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}