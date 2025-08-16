import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { type UpdateSponsorInput, type Sponsor } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSponsor = async (input: UpdateSponsorInput): Promise<Sponsor> => {
  try {
    const { id, ...updateData } = input;
    
    // Build update object with only provided fields
    const fieldsToUpdate: Record<string, any> = {};
    
    if (updateData.company_name !== undefined) {
      fieldsToUpdate['company_name'] = updateData.company_name;
    }
    if (updateData.contact_email !== undefined) {
      fieldsToUpdate['contact_email'] = updateData.contact_email;
    }
    if (updateData.contact_phone !== undefined) {
      fieldsToUpdate['contact_phone'] = updateData.contact_phone;
    }
    if (updateData.industry !== undefined) {
      fieldsToUpdate['industry'] = updateData.industry;
    }
    if (updateData.description !== undefined) {
      fieldsToUpdate['description'] = updateData.description;
    }

    // Add updated_at timestamp
    fieldsToUpdate['updated_at'] = new Date();

    // Update the sponsor record
    const result = await db.update(sponsorsTable)
      .set(fieldsToUpdate)
      .where(eq(sponsorsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Sponsor with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Sponsor update failed:', error);
    throw error;
  }
};