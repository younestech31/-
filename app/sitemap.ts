import { MetadataRoute } from 'next';
import { SITE_URL as base } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${base}/`,
      lastModified: new Date('2026-08-04'),
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'ar-DZ': `${base}/`,
          'x-default': `${base}/`,
        },
      },
    },
    {
      url: `${base}/faq`,
      lastModified: new Date('2026-07-28'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/how-to`,
      lastModified: new Date('2026-07-25'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/ميراث-الزوجة`,
      lastModified: new Date('2026-07-30'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/الوصية-الواجبة`,
      lastModified: new Date('2026-08-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
