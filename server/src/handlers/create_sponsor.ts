import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { type CreateSponsorInput, type Sponsor } from '../schema';

export const createSponsor = async (input: CreateSponsorInput): Promise<Sponsor> => {
  try {
    // Insert sponsor record
    const result = await db.insert(sponsorsTable)
      .values({
        company_name: input.company_name,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone || null,
        industry: input.industry,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Sponsor creation failed:', error);
    throw error;
  }
};