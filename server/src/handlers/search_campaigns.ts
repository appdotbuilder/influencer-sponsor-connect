import { db } from '../db';
import { campaignsTable, productsTable } from '../db/schema';
import { type SearchCampaignsInput, type Campaign } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export const searchCampaigns = async (input: SearchCampaignsInput): Promise<Campaign[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Check if we need to join with products table for category filtering
    const needsProductJoin = input.category !== undefined;

    // Start with base query - handle join vs no join separately
    let query;
    
    if (needsProductJoin) {
      // Query with join - results will be nested
      query = db.select({
        campaigns: campaignsTable,
        products: productsTable
      })
      .from(campaignsTable)
      .innerJoin(productsTable, eq(campaignsTable.product_id, productsTable.id));

      // Add category condition
      conditions.push(eq(productsTable.category, input.category!));
    } else {
      // Query without join - results will be flat
      query = db.select()
        .from(campaignsTable);
    }

    // Filter by sponsor_id
    if (input.sponsor_id !== undefined) {
      conditions.push(eq(campaignsTable.sponsor_id, input.sponsor_id));
    }

    // Filter by budget range
    if (input.min_budget !== undefined) {
      conditions.push(gte(campaignsTable.budget, input.min_budget.toString()));
    }

    if (input.max_budget !== undefined) {
      conditions.push(lte(campaignsTable.budget, input.max_budget.toString()));
    }

    // Filter by status
    if (input.status) {
      conditions.push(eq(campaignsTable.status, input.status));
    }

    // Apply where conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Apply pagination
    query = query.limit(input.limit).offset(input.offset);

    const results = await query.execute();

    // Handle different result structures based on join
    return results.map(result => {
      // If joined, data is nested: { campaigns: {...}, products: {...} }
      // If not joined, data is flat campaign object
      const campaignData = needsProductJoin 
        ? (result as any).campaigns 
        : result;

      return {
        ...campaignData,
        budget: parseFloat(campaignData.budget) // Convert numeric field back to number
      };
    });
  } catch (error) {
    console.error('Campaign search failed:', error);
    throw error;
  }
};