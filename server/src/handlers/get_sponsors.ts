import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { type Sponsor } from '../schema';

export const getSponsors = async (): Promise<Sponsor[]> => {
  try {
    const results = await db.select()
      .from(sponsorsTable)
      .execute();

    // Convert timestamps to Date objects to match schema expectations
    return results.map(sponsor => ({
      ...sponsor,
      created_at: new Date(sponsor.created_at),
      updated_at: new Date(sponsor.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch sponsors:', error);
    throw error;
  }
};