import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Return products with proper type conversion
    return results.map(product => ({
      ...product,
      // All fields are already the correct types for this table
      // No numeric conversions needed as this table doesn't have numeric columns
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};