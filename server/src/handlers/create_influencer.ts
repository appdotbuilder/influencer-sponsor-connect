import { db } from '../db';
import { influencersTable } from '../db/schema';
import { type CreateInfluencerInput, type Influencer } from '../schema';

export const createInfluencer = async (input: CreateInfluencerInput): Promise<Influencer> => {
  try {
    // Insert influencer record
    const result = await db.insert(influencersTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        bio: input.bio || null,
        portfolio_description: input.portfolio_description || null
      })
      .returning()
      .execute();

    // Return the created influencer
    const influencer = result[0];
    return influencer;
  } catch (error) {
    console.error('Influencer creation failed:', error);
    throw error;
  }
};