import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        sponsor_id: input.sponsor_id,
        name: input.name,
        description: input.description || null,
        category: input.category,
        target_audience: input.target_audience || null
      })
      .returning()
      .execute();

    // Return the created product
    const product = result[0];
    return product;
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};