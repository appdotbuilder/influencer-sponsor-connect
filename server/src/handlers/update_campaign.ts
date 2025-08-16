import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type UpdateCampaignInput, type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCampaign = async (input: UpdateCampaignInput): Promise<Campaign> => {
  try {
    // First, check if the campaign exists
    const existing = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, input.id))
      .limit(1)
      .execute();

    if (existing.length === 0) {
      throw new Error(`Campaign with id ${input.id} not found`);
    }

    // Prepare update data with numeric conversion for budget
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.budget !== undefined) {
      updateData.budget = input.budget.toString(); // Convert number to string for numeric column
    }
    if (input.target_audience !== undefined) {
      updateData.target_audience = input.target_audience;
    }
    if (input.objectives !== undefined) {
      updateData.objectives = input.objectives;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.start_date !== undefined) {
      updateData.start_date = input.start_date;
    }
    if (input.end_date !== undefined) {
      updateData.end_date = input.end_date;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the campaign
    const result = await db.update(campaignsTable)
      .set(updateData)
      .where(eq(campaignsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const campaign = result[0];
    return {
      ...campaign,
      budget: parseFloat(campaign.budget) // Convert string back to number
    };
  } catch (error) {
    console.error('Campaign update failed:', error);
    throw error;
  }
};