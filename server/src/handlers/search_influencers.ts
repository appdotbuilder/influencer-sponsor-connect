import { db } from '../db';
import { influencersTable, socialMediaAccountsTable, performanceIndicatorsTable } from '../db/schema';
import { type SearchInfluencersInput, type Influencer } from '../schema';
import { eq, gte, lte, and, sql, type SQL } from 'drizzle-orm';

export async function searchInfluencers(input: SearchInfluencersInput): Promise<Influencer[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Check what joins we need based on filters
    const needsPerformanceJoin = 
      input.min_followers !== undefined || 
      input.max_followers !== undefined || 
      input.min_engagement_rate !== undefined ||
      input.category !== undefined;
    
    const needsSocialMediaJoin = 
      input.platform !== undefined ||
      input.category !== undefined;

    // Build conditions
    if (input.category) {
      conditions.push(
        sql`(${influencersTable.bio} ILIKE ${'%' + input.category + '%'} 
         OR ${influencersTable.portfolio_description} ILIKE ${'%' + input.category + '%'})`
      );
    }

    if (input.min_followers !== undefined) {
      conditions.push(gte(performanceIndicatorsTable.followers_count, input.min_followers));
    }
    
    if (input.max_followers !== undefined) {
      conditions.push(lte(performanceIndicatorsTable.followers_count, input.max_followers));
    }

    if (input.platform) {
      conditions.push(eq(socialMediaAccountsTable.platform, input.platform));
    }

    if (input.min_engagement_rate !== undefined) {
      conditions.push(gte(performanceIndicatorsTable.avg_engagement_rate, input.min_engagement_rate.toString()));
    }

    // Execute different queries based on what joins are needed
    let results;

    if (needsPerformanceJoin && needsSocialMediaJoin) {
      // Query with both joins
      results = await db.select({
        id: influencersTable.id,
        name: influencersTable.name,
        email: influencersTable.email,
        phone: influencersTable.phone,
        bio: influencersTable.bio,
        portfolio_description: influencersTable.portfolio_description,
        created_at: influencersTable.created_at,
        updated_at: influencersTable.updated_at,
      })
      .from(influencersTable)
      .innerJoin(socialMediaAccountsTable, eq(influencersTable.id, socialMediaAccountsTable.influencer_id))
      .innerJoin(performanceIndicatorsTable, eq(influencersTable.id, performanceIndicatorsTable.influencer_id))
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .groupBy(
        influencersTable.id,
        influencersTable.name,
        influencersTable.email,
        influencersTable.phone,
        influencersTable.bio,
        influencersTable.portfolio_description,
        influencersTable.created_at,
        influencersTable.updated_at
      )
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    } else if (needsPerformanceJoin) {
      // Query with performance join only
      const query = conditions.length > 0
        ? db.select({
            id: influencersTable.id,
            name: influencersTable.name,
            email: influencersTable.email,
            phone: influencersTable.phone,
            bio: influencersTable.bio,
            portfolio_description: influencersTable.portfolio_description,
            created_at: influencersTable.created_at,
            updated_at: influencersTable.updated_at,
          })
          .from(influencersTable)
          .innerJoin(performanceIndicatorsTable, eq(influencersTable.id, performanceIndicatorsTable.influencer_id))
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .groupBy(
            influencersTable.id,
            influencersTable.name,
            influencersTable.email,
            influencersTable.phone,
            influencersTable.bio,
            influencersTable.portfolio_description,
            influencersTable.created_at,
            influencersTable.updated_at
          )
          .limit(input.limit)
          .offset(input.offset)
        : db.select({
            id: influencersTable.id,
            name: influencersTable.name,
            email: influencersTable.email,
            phone: influencersTable.phone,
            bio: influencersTable.bio,
            portfolio_description: influencersTable.portfolio_description,
            created_at: influencersTable.created_at,
            updated_at: influencersTable.updated_at,
          })
          .from(influencersTable)
          .innerJoin(performanceIndicatorsTable, eq(influencersTable.id, performanceIndicatorsTable.influencer_id))
          .groupBy(
            influencersTable.id,
            influencersTable.name,
            influencersTable.email,
            influencersTable.phone,
            influencersTable.bio,
            influencersTable.portfolio_description,
            influencersTable.created_at,
            influencersTable.updated_at
          )
          .limit(input.limit)
          .offset(input.offset);

      results = await query.execute();

    } else if (needsSocialMediaJoin) {
      // Query with social media join only
      const query = conditions.length > 0
        ? db.select({
            id: influencersTable.id,
            name: influencersTable.name,
            email: influencersTable.email,
            phone: influencersTable.phone,
            bio: influencersTable.bio,
            portfolio_description: influencersTable.portfolio_description,
            created_at: influencersTable.created_at,
            updated_at: influencersTable.updated_at,
          })
          .from(influencersTable)
          .innerJoin(socialMediaAccountsTable, eq(influencersTable.id, socialMediaAccountsTable.influencer_id))
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .groupBy(
            influencersTable.id,
            influencersTable.name,
            influencersTable.email,
            influencersTable.phone,
            influencersTable.bio,
            influencersTable.portfolio_description,
            influencersTable.created_at,
            influencersTable.updated_at
          )
          .limit(input.limit)
          .offset(input.offset)
        : db.select({
            id: influencersTable.id,
            name: influencersTable.name,
            email: influencersTable.email,
            phone: influencersTable.phone,
            bio: influencersTable.bio,
            portfolio_description: influencersTable.portfolio_description,
            created_at: influencersTable.created_at,
            updated_at: influencersTable.updated_at,
          })
          .from(influencersTable)
          .innerJoin(socialMediaAccountsTable, eq(influencersTable.id, socialMediaAccountsTable.influencer_id))
          .groupBy(
            influencersTable.id,
            influencersTable.name,
            influencersTable.email,
            influencersTable.phone,
            influencersTable.bio,
            influencersTable.portfolio_description,
            influencersTable.created_at,
            influencersTable.updated_at
          )
          .limit(input.limit)
          .offset(input.offset);

      results = await query.execute();

    } else {
      // Simple query without joins
      const query = conditions.length > 0
        ? db.select({
            id: influencersTable.id,
            name: influencersTable.name,
            email: influencersTable.email,
            phone: influencersTable.phone,
            bio: influencersTable.bio,
            portfolio_description: influencersTable.portfolio_description,
            created_at: influencersTable.created_at,
            updated_at: influencersTable.updated_at,
          })
          .from(influencersTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .limit(input.limit)
          .offset(input.offset)
        : db.select({
            id: influencersTable.id,
            name: influencersTable.name,
            email: influencersTable.email,
            phone: influencersTable.phone,
            bio: influencersTable.bio,
            portfolio_description: influencersTable.portfolio_description,
            created_at: influencersTable.created_at,
            updated_at: influencersTable.updated_at,
          })
          .from(influencersTable)
          .limit(input.limit)
          .offset(input.offset);

      results = await query.execute();
    }

    return results;
  } catch (error) {
    console.error('Influencer search failed:', error);
    throw error;
  }
}