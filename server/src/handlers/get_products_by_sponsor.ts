import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductsBySponsor = async (sponsorId: number): Promise<Product[]> => {
  try {
    // Query products by sponsor ID
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sponsor_id, sponsorId))
      .execute();

    // Return products with proper type conversion (no numeric fields in products table)
    return results;
  } catch (error) {
    console.error('Failed to fetch products by sponsor:', error);
    throw error;
  }
};