import { MetadataRoute } from 'next';
import { SITE_URL as base } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'ar-DZ': `${base}/`,
          'x-default': `${base}/`,
        },
      },
    },
  ];
}
