import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import { requireAuth } from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query: any = {};
    
    // Search by title or description
    if (searchParams.has('search')) {
      const searchRegex = new RegExp(searchParams.get('search') as string, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Filter by shop category
    if (searchParams.has('shop_category')) {
  const shop = decodeURIComponent(searchParams.get('shop_category') || '');

  if (shop && shop !== 'Select Shop') {
    query.shop_category = shop;
  }
}
        // Filter by categories
    if (searchParams.has('categories')) {
      const categories = searchParams.get('categories')?.split(',') || [];
      query.categories = { $in: categories };
    }

    const minPrice = searchParams.get("minPrice");
const maxPrice = searchParams.get("maxPrice");

if (
  (minPrice && minPrice.trim() !== "") ||
  (maxPrice && maxPrice.trim() !== "")
) {
  query.price = {};

  if (minPrice && minPrice.trim() !== "") {
    query.price.$gte = Number(minPrice);
  }

  if (maxPrice && maxPrice.trim() !== "") {
    query.price.$lte = Number(maxPrice);
  }
}

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Sorting
 let sort: any = { createdAt: -1 };

 const sortParam = searchParams.get("sort");

 if (sortParam && sortParam.trim() !== "") {
  const [field, order] = sortParam.split(":");

  if (field) {
    sort = {
      [field]: order === "desc" ? -1 : 1,
    };
  }
}

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const formattedProducts = products.map((product: any) => ({
  ...product.toObject(),
  _id: product.originalId,
}));

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
  console.error("========== API ERROR ==========");
  console.error(error);
  console.error("MESSAGE:", error?.message);
  console.error("STACK:", error?.stack);

  return NextResponse.json(
    {
      error: error?.message || "Failed to fetch products",
    },
    { status: 500 }
  );
}
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const product = await Product.create(body);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}
