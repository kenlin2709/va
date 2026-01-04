export type Product = {
  slug: string;
  title: string;
  price: number; // AUD
  images: string[];
  inStock: boolean;
  highlights: string[];
  description: string;
  disclaimer: string;
};

// Minimal demo catalog seeded from the public product page content.
// Reference: https://vapelabgroup.com.au/collections/all-products/products/cloudy-apple-vape-juice
export const PRODUCT_CATALOG: Product[] = [
  {
    slug: 'cloudy-apple-vape-juice',
    title: 'Cloudy Apple Vape Juice',
    price: 26.95,
    inStock: true,
    images: [
     'https://snowplusaus.com/wp-content/uploads/2025/03/7.png'
    ],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description:
      '**CLOUDY APPLE:** Cloudy Apple is the mouth-watering taste of an orchard-fresh apple with a hint of luscious creaminess. This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  },
  {
    slug: 'bonkers-banana-vape-juice',
    title: 'Bonkers Banana Vape Juice',
    price: 26.95,
    inStock: true,
    images: ['https://snowplusaus.com/wp-content/uploads/2025/03/7.png'],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description: 'A smooth banana flavour profile (demo content). This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  },
  {
    slug: 'blackberry-blast-fruit-vape-juice',
    title: 'Blackberry Blast Fruit Vape Juice',
    price: 26.95,
    inStock: true,
    images: ['https://vapelabgroup.com.au/cdn/shop/products/Mumm_s.png?crop=center&height=900&v=1631301263&width=900'],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description: 'A bold blackberry blend (demo content). This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  },
  {
    slug: 'crazy-coconut-vape-juice',
    title: 'Crazy Coconut Vape Juice',
    price: 26.95,
    inStock: true,
    images: ['https://vapelabgroup.com.au/cdn/shop/products/Mumm_s.png?crop=center&height=900&v=1631301263&width=900'],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description: 'A creamy coconut flavour (demo content). This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  },
  {
    slug: 'peppermint-tobacco-vape-juice',
    title: 'Peppermint Tobacco Vape Juice',
    price: 26.95,
    inStock: true,
    images: ['https://vapelabgroup.com.au/cdn/shop/products/Mumm_s.png?crop=center&height=900&v=1631301263&width=900'],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description: 'Peppermint + tobacco notes (demo content). This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  },
  {
    slug: 'dram-tobacco-vape-juice',
    title: 'Dram Tobacco Vape Juice',
    price: 26.95,
    inStock: true,
    images: ['https://vapelabgroup.com.au/cdn/shop/products/Mumm_s.png?crop=center&height=900&v=1631301263&width=900'],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description: 'A smooth tobacco blend (demo content). This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  },
  {
    slug: 'marks-american-bourbon-vape-juice',
    title: "Mark's American Bourbon Vape Juice",
    price: 26.95,
    inStock: true,
    images: ['https://vapelabgroup.com.au/cdn/shop/products/Mumm_s.png?crop=center&height=900&v=1631301263&width=900'],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description: 'A bourbon-inspired flavour (demo content). This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  },
  {
    slug: 'koheeba-tobacco-vape-juice',
    title: 'Koheeba Tobacco Vape Juice',
    price: 26.95,
    inStock: true,
    images: ['https://vapelabgroup.com.au/cdn/shop/products/Mumm_s.png?crop=center&height=900&v=1631301263&width=900'],
    highlights: ['Lab-Crafted Quality', 'Perfect VG/PG Balance', 'Unforgettable Flavours', 'Made In Australian'],
    description: 'A rich tobacco profile (demo content). This product DOES NOT contain nicotine.',
    disclaimer:
      'E-liquid is clear, they have been coloured for illustrative purposes only. This product DOES NOT contain nicotine.'
  }
];

export function findProductBySlug(slug: string): Product | undefined {
  return PRODUCT_CATALOG.find((p) => p.slug === slug);
}


