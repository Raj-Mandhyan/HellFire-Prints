import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetails from '@/components/ProductDetails';
import { notFound } from 'next/navigation';
import { getProductRatingSummaryAction } from '@/app/actions/review';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product = null;

  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        variants: {
          include: {
            size: true,
            frame: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching product in server component:', error);
  }

  if (!product) {
    notFound();
  }

  // Fetch initial rating summary on server-side
  const summaryRes = await getProductRatingSummaryAction(product.id);
  const initialSummary = summaryRes.success && summaryRes.summary ? summaryRes.summary : {
    totalReviews: 0,
    averageRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  // Fetch initial likes information on server-side
  const user = await getCurrentUser();
  const [likesCount, userLike] = await Promise.all([
    prisma.productLike.count({
      where: { productId: product.id },
    }),
    user
      ? prisma.productLike.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId: product.id,
            },
          },
        })
      : null,
  ]);

  const initialLikesCount = likesCount;
  const initialIsLiked = !!userLike;

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
      {/* Brand Header */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {/* Interactive details section */}
        <ProductDetails 
          product={product} 
          initialSummary={initialSummary} 
          initialLikesCount={initialLikesCount}
          initialIsLiked={initialIsLiked}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
