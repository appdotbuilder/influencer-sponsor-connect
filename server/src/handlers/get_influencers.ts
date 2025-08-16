import { db } from '../db';
import { influencersTable } from '../db/schema';
import { type Influencer } from '../schema';

export const getInfluencers = async (): Promise<Influencer[]> => {
  try {
    // Fetch all influencers from database
    const results = await db.select()
      .from(influencersTable)
      .execute();

    // Return influencers with proper type conversion
    return results;
  } catch (error) {
    console.error('Failed to fetch influencers:', error);
    throw error;
  }
};