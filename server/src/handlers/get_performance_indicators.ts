import { db } from '../db';
import { performanceIndicatorsTable } from '../db/schema';
import { type PerformanceIndicators } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPerformanceIndicatorsByInfluencer(influencerId: number): Promise<PerformanceIndicators[]> {
  try {
    const results = await db.select()
      .from(performanceIndicatorsTable)
      .where(eq(performanceIndicatorsTable.influencer_id, influencerId))
      .execute();

    // Convert numeric fields back to numbers for proper typing
    return results.map(result => ({
      ...result,
      avg_engagement_rate: result.avg_engagement_rate ? parseFloat(result.avg_engagement_rate) : null
    }));
  } catch (error) {
    console.error('Failed to fetch performance indicators:', error);
    throw error;
  }
}