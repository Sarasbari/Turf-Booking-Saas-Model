import { useEffect } from 'react';

const SITE_NAME = 'aLiveHub';
const SITE_URL = 'https://alivehub.vercel.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-logo.png`;

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/**
 * Dynamic SEO hook — sets <title>, meta description,
 * Open Graph, and Twitter Card tags for each page.
 */
export function useSEO({
  title,
  description,
  keywords,
  image = DEFAULT_OG_IMAGE,
  url,
  type = 'website',
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // ── Title ──
    document.title = `${title} | ${SITE_NAME}`;

    // ── Helper: set or create a <meta> tag ──
    const setMeta = (name: string, content: string, useProperty = false) => {
      const attr = useProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // ── Helper: set or create a <link> tag ──
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // ── Standard meta ──
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);

    // ── Robots ──
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      // Remove noindex if it was set by a previous page
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }

    // ── Canonical URL ──
    const canonicalUrl = url || `${SITE_URL}${window.location.pathname}`;
    setLink('canonical', canonicalUrl);

    // ── Open Graph (Facebook, WhatsApp, LinkedIn) ──
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:type', type, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', SITE_NAME, true);

    // ── Twitter Card ──
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
  }, [title, description, keywords, image, url, type, noindex]);
}
