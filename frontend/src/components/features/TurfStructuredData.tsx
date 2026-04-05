/**
 * TurfStructuredData — JSON-LD structured data for individual turf pages.
 * Uses Schema.org SportsActivityLocation for rich Google results
 * (star ratings, prices, location in search).
 */

interface TurfStructuredDataProps {
  turf: {
    id: string;
    name: string;
    about?: string;
    sports?: string[];
    sport?: string;
    images?: string[];
    ownerPhone?: string;
    address: string;
    city: string;
    state?: string;
    pincode?: string;
    geoPoint?: { latitude: number; longitude: number } | null;
    pricePerHour: number;
    rating: number;
    totalReviews: number;
    amenities?: string[];
    openTime?: string;
    closeTime?: string;
    slug?: string;
  };
}

export function TurfStructuredData({ turf }: TurfStructuredDataProps) {
  const sportsText = turf.sports?.join(', ') || turf.sport || 'Sports';
  const turfUrl = `https://alivehub.vercel.app/turf/${turf.slug || turf.id}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: turf.name,
    description: `Book ${turf.name} online. ${sportsText} turf in ${turf.city}.${turf.about ? ' ' + turf.about.slice(0, 150) : ''}`,
    url: turfUrl,
    image: turf.images || [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: turf.address,
      addressLocality: turf.city,
      addressRegion: turf.state || 'Maharashtra',
      postalCode: turf.pincode || '',
      addressCountry: 'IN',
    },
    priceRange: `₹${turf.pricePerHour}/hr`,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: turf.openTime || '06:00',
      closes: turf.closeTime || '23:00',
    },
  };

  // Telephone
  if (turf.ownerPhone) {
    schema.telephone = turf.ownerPhone;
  }

  // Geo coordinates
  if (turf.geoPoint?.latitude && turf.geoPoint?.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: turf.geoPoint.latitude,
      longitude: turf.geoPoint.longitude,
    };
  }

  // Aggregate rating (only if reviews exist)
  if (turf.totalReviews > 0 && turf.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: turf.rating,
      reviewCount: turf.totalReviews,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Amenity features
  if (turf.amenities && turf.amenities.length > 0) {
    schema.amenityFeature = turf.amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
