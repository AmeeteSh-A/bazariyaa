import { notFound } from 'next/navigation';
import ProductView from '@/views/Product';
import { getProductDetails } from '@/lib/api';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const data = await getProductDetails(id);
  
  if (!data) notFound();

  return <ProductView {...data} />;
}