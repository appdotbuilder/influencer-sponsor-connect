import { db } from '../db';
import { influencersTable } from '../db/schema';
import { type UpdateInfluencerInput, type Influencer } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateInfluencer(input: UpdateInfluencerInput): Promise<Influencer> {
  try {
    // Extract id and update fields
    const { id, ...updateFields } = input;

    // Check if influencer exists before updating
    const existingInfluencer = await db.select()
      .from(influencersTable)
      .where(eq(influencersTable.id, id))
      .execute();

    if (existingInfluencer.length === 0) {
      throw new Error(`Influencer with id ${id} not found`);
    }

    // Update the influencer record with updated_at timestamp
    const result = await db.update(influencersTable)
      .set({
        ...updateFields,
        updated_at: new Date()
      })
      .where(eq(influencersTable.id, id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Influencer update failed:', error);
    throw error;
  }
}