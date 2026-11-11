// The public address of the website. Facebook and Messenger link previews need full URLs.
// When the church moves to its own domain, change it here (and site_url in docs/admin/config.yml), then run npm run build.
export const SITE = 'https://thorskii92.github.io/faithway-bbc/';
// Cloudflare Web Analytics token: free visitor counts, no cookies, no personal data. Empty = off.
// To get it: Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site → thorskii92.github.io →
// copy the token from the snippet (data-cf-beacon='{"token": "..."}'), paste it here and run npm run build.
export const ANALYTICS_TOKEN = '';
export const CHURCH ='Faithway Bible Baptist Church';
export const DESCRIPTION = 'Palawan Faithway Bible Baptist Church, Inc. Purok Matapat, San Jose, Puerto Princesa City. Passion for God. Compassion to People.';

export const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Open Graph / Twitter tags: what Facebook, Messenger and others show when someone shares a link
export function ogTags({ title, description = DESCRIPTION, image = 'img/og.jpg', url = SITE, type = 'website' }) {
  const abs = (p) => (/^https?:/.test(p) ? p : SITE + p.replace(/^\/+/, ''));
  return [
    ['og:site_name', CHURCH], ['og:type', type], ['og:title', title], ['og:description', description],
    ['og:url', abs(url)], ['og:image', abs(image)],
  ].map(([k, v]) => `<meta property="${k}" content="${escAttr(v)}">`).join('\n')
    + `\n<meta name="twitter:card" content="summary_large_image">`;
}
