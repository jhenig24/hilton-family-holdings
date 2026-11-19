# Hilton Family Real Estate Holdings

Private, password-protected portfolio site.

## Files
- `index.html` - the site
- `data.json` - all portfolio figures (regenerated when the deck is updated)
- `photos/` - property photos, family photo and logo
- `Hilton_Family_Real_Estate_Holdings.pdf` - the deck, for the Download PDF button
- `middleware.js` - the password check (runs on Vercel before anything loads)

## Password
Set in Vercel: Project > Settings > Environment Variables > `SITE_PASSWORD`.
Change it there and redeploy; everyone signs in again with the new one.

## Updating
Replace `data.json`, the PDF and any new photos, commit, and Vercel redeploys automatically.
