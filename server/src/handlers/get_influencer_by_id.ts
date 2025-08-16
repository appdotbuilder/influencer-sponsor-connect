import { db } from '../db';
import { influencersTable } from '../db/schema';
import { type Influencer } from '../schema';
import { eq } from 'drizzle-orm';

export async function getInfluencerById(id: number): Promise<Influencer | null> {
  try {
    const result = await db.select()
      .from(influencersTable)
      .where(eq(influencersTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const influencer = result[0];
    
    return {
      ...influencer,
      created_at: influencer.created_at,
      updated_at: influencer.updated_at
    };
  } catch (error) {
    console.error('Failed to get influencer by id:', error);
    throw error;
  }
}