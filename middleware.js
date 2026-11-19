// Password protection for the whole site (runs on Vercel before any file is served).
// Set the password in Vercel: Project > Settings > Environment Variables > SITE_PASSWORD.

export const config = { matcher: "/:path*" };

const COOKIE = "hf_auth";
const OPEN = ["/photos/logo.png", "/photos/cover_wide.jpg"]; // shown on the sign-in page

async function tokenFor(pw) {
  const bytes = new TextEncoder().encode("hilton-family-holdings:" + pw);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

function signInPage(wrong) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Hilton Family Holdings</title>
<link rel="icon" href="/photos/logo.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">
<style>
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;background:radial-gradient(90% 80% at 50% 0%,#26354A 0%,#16202C 55%,#0E141C 100%);display:flex;align-items:center;justify-content:center;padding:24px 20px;position:relative}
body::before{content:"";position:fixed;inset:0;background:url("/photos/cover_wide.jpg") center 30%/cover;opacity:.08;filter:grayscale(1);pointer-events:none}
main{position:relative;width:100%;max-width:440px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:22px}
.logo{width:300px;max-width:80%;border:1px solid #C9A35C;box-shadow:0 20px 60px rgba(0,0,0,.45)}
.rule{width:56px;height:1px;background:#D9BB82;opacity:.7}
.sub{margin:0;font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:#D9BB82;font-weight:600}
form{width:100%;display:flex;flex-direction:column;gap:10px;margin-top:10px;text-align:left}
label{font-size:13px;color:#AEB7C4;letter-spacing:.06em;text-transform:uppercase;font-weight:600}
.row{display:flex;gap:10px}
input{flex:1;min-width:0;height:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;padding:0 16px;font-size:17px;outline:0;font-family:inherit}
input::placeholder{color:#7F8A99}
input:focus{border-color:#D9BB82;background:rgba(255,255,255,.09)}
button{height:54px;padding:0 26px;border:0;border-radius:10px;background:#D9BB82;color:#16202C;font-weight:700;font-size:16px;cursor:pointer;font-family:inherit}
button:hover{background:#E6CB97}
.err{margin:2px 0 0;color:#F2A3A8;font-size:15px}
.foot{margin:18px 0 0;font-size:13px;color:#7F8A99}
</style></head><body><main>
<img class="logo" src="/photos/logo.png" alt="Hilton Family Real Estate Holdings">
<div class="rule"></div>
<p class="sub">Private Portfolio Record</p>
<form method="post" action="/login">
<label for="password">Password</label>
<div class="row"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter password" required autofocus><button type="submit">Enter</button></div>
${wrong ? '<p class="err" role="alert">That password is not correct. Please try again.</p>' : ""}
</form>
<p class="foot">Private and confidential</p>
</main></body></html>`;
  return new Response(html, { status: wrong ? 401 : 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export default async function middleware(req) {
  const url = new URL(req.url);
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return new Response("Site password is not set. Add SITE_PASSWORD in Vercel settings.", { status: 503 });
  const token = await tokenFor(pw);

  if (url.pathname === "/logout") {
    return new Response(null, { status: 303, headers: { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }
  if (url.pathname === "/login" && req.method === "POST") {
    const form = await req.formData();
    if (form.get("password") === pw) {
      return new Response(null, { status: 303, headers: { Location: "/", "Set-Cookie": `${COOKIE}=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax` } });
    }
    return signInPage(true);
  }
  if (readCookie(req, COOKIE) === token) return; // signed in: serve the site
  if (OPEN.includes(url.pathname)) return;
  return signInPage(false);
}
