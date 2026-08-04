import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/lib/models/product";

export async function GET() {
  try {
    await dbConnect();

    const products = await Product.find({ shop_category: "books" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const formattedProducts = products.map((item: any) => ({
      ...item,
      _id: item.originalId,
    }));

    return NextResponse.json({
      products: formattedProducts,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
