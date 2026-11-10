// Google Analytics 4. Page views only, no ads signals, no user IDs.
// gtag.js can't carry an SRI hash (Google serves it unversioned), so it is the one external script loaded
// without one. It is confined to www.googletagmanager.com in the CSP; see SECURITY.md.
(() => {
  const GA_ID = 'G-4VVDQVH790';
  if (!/^G-[A-Z0-9]{6,12}$/.test(GA_ID) || !/(^|\.)pearlascope\.com$/.test(location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
})();
