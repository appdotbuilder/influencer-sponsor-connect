import { db } from '../db';
import { performanceIndicatorsTable, influencersTable } from '../db/schema';
import { type CreatePerformanceIndicatorsInput, type PerformanceIndicators } from '../schema';
import { eq } from 'drizzle-orm';

export const createPerformanceIndicators = async (input: CreatePerformanceIndicatorsInput): Promise<PerformanceIndicators> => {
  try {
    // Verify the influencer exists
    const influencer = await db.select()
      .from(influencersTable)
      .where(eq(influencersTable.id, input.influencer_id))
      .execute();

    if (influencer.length === 0) {
      throw new Error(`Influencer with ID ${input.influencer_id} not found`);
    }

    // Insert performance indicators record
    const result = await db.insert(performanceIndicatorsTable)
      .values({
        influencer_id: input.influencer_id,
        platform: input.platform,
        followers_count: input.followers_count,
        avg_views: input.avg_views ?? null,
        avg_engagement_rate: input.avg_engagement_rate?.toString() ?? null, // Convert number to string for numeric column
        total_posts: input.total_posts ?? null,
        last_updated: new Date(),
        created_at: new Date()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const performanceIndicators = result[0];
    return {
      ...performanceIndicators,
      avg_engagement_rate: performanceIndicators.avg_engagement_rate 
        ? parseFloat(performanceIndicators.avg_engagement_rate) 
        : null
    };
  } catch (error) {
    console.error('Performance indicators creation failed:', error);
    throw error;
  }
};