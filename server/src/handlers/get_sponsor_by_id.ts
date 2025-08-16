import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Sponsor } from '../schema';

export async function getSponsorById(id: number): Promise<Sponsor | null> {
  try {
    const results = await db.select()
      .from(sponsorsTable)
      .where(eq(sponsorsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const sponsor = results[0];
    return sponsor;
  } catch (error) {
    console.error('Get sponsor by ID failed:', error);
    throw error;
  }
}