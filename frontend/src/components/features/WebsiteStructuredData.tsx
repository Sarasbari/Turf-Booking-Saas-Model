/**
 * WebsiteStructuredData — JSON-LD for the home page.
 * Enables Google Sitelinks Search Box and website identity.
 */
export function WebsiteStructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'aLiveHub',
    url: 'https://alivehub.vercel.app',
    description:
      'Book sports turfs in Mumbai instantly. Cricket, football, volleyball — real-time slot availability with instant confirmation.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://alivehub.vercel.app/listings?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
