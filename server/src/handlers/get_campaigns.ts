import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type Campaign } from '../schema';

export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    const results = await db.select()
      .from(campaignsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(campaign => ({
      ...campaign,
      budget: parseFloat(campaign.budget) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get campaigns failed:', error);
    throw error;
  }
};