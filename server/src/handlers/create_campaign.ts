import { db } from '../db';
import { campaignsTable, sponsorsTable, productsTable } from '../db/schema';
import { type CreateCampaignInput, type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export const createCampaign = async (input: CreateCampaignInput): Promise<Campaign> => {
  try {
    // Verify that the sponsor exists
    const sponsor = await db.select()
      .from(sponsorsTable)
      .where(eq(sponsorsTable.id, input.sponsor_id))
      .execute();

    if (sponsor.length === 0) {
      throw new Error(`Sponsor with id ${input.sponsor_id} not found`);
    }

    // Verify that the product exists and belongs to the sponsor
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    if (product[0].sponsor_id !== input.sponsor_id) {
      throw new Error(`Product ${input.product_id} does not belong to sponsor ${input.sponsor_id}`);
    }

    // Insert campaign record
    const result = await db.insert(campaignsTable)
      .values({
        sponsor_id: input.sponsor_id,
        product_id: input.product_id,
        title: input.title,
        description: input.description || null,
        budget: input.budget.toString(), // Convert number to string for numeric column
        target_audience: input.target_audience || null,
        objectives: input.objectives || null,
        status: input.status || 'draft',
        start_date: input.start_date || null,
        end_date: input.end_date || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const campaign = result[0];
    return {
      ...campaign,
      budget: parseFloat(campaign.budget) // Convert string back to number
    };
  } catch (error) {
    console.error('Campaign creation failed:', error);
    throw error;
  }
};