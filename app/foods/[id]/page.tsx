import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';


async function getDishDetail(id: string) {
  try {
    const res = await fetch(`http://localhost:3000/api/foods/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error("Error fetching dish detail API:", error);
    return null;
  }
}

export default async function DishDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  const resolvedParams = await params;
  const dish = await getDishDetail(resolvedParams.id);

  if (!dish) {
    notFound();
  }

  
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeString;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8">
        
        {/* Restaurant Label & Hours */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full">
            🏪 {dish.restaurant?.name || 'Restaurant'}
          </span>
          <span className="text-sm text-gray-500">
            Opening Hours: {formatTime(dish.restaurant?.openTime)} - {formatTime(dish.restaurant?.closeTime)}
          </span>
        </div>

        {/* Dish Name and Price */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{dish.name}</h1>
        <p className="text-2xl font-bold text-rose-600 mb-6">
          {Number(dish.price).toLocaleString('en-US')} VND
        </p>

        {/* Detailed Description */}
        <div className="border-t border-b border-gray-100 py-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Dish Description:</h3>
          <p className="text-gray-600">
            {dish.description || 'No additional description available for this dish.'}
          </p>
        </div>

        {/* Additional Note from Restaurant */}
        {dish.restaurant?.note && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
            💡 **Note from restaurant:** {dish.restaurant.note}
          </div>
        )}

        {/* Order Interaction Area */}
        <div className="mt-8">
          <AddToCartButton dish={dish} />
        </div>

      </div>
    </main>
  );
}