import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { influencersTable, performanceIndicatorsTable } from '../db/schema';
import { getPerformanceIndicatorsByInfluencer } from '../handlers/get_performance_indicators';
import { eq } from 'drizzle-orm';

describe('getPerformanceIndicatorsByInfluencer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return performance indicators for a specific influencer', async () => {
    // Create test influencer
    const influencerResult = await db.insert(influencersTable)
      .values({
        name: 'Test Influencer',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const influencerId = influencerResult[0].id;

    // Create performance indicators for the influencer
    await db.insert(performanceIndicatorsTable)
      .values([
        {
          influencer_id: influencerId,
          platform: 'instagram',
          followers_count: 50000,
          avg_views: 5000,
          avg_engagement_rate: '4.50',
          total_posts: 100
        },
        {
          influencer_id: influencerId,
          platform: 'youtube',
          followers_count: 25000,
          avg_views: 10000,
          avg_engagement_rate: '6.20',
          total_posts: 50
        }
      ])
      .execute();

    const result = await getPerformanceIndicatorsByInfluencer(influencerId);

    expect(result).toHaveLength(2);

    // Verify first indicator
    const instagramIndicator = result.find(pi => pi.platform === 'instagram');
    expect(instagramIndicator).toBeDefined();
    expect(instagramIndicator!.influencer_id).toEqual(influencerId);
    expect(instagramIndicator!.followers_count).toEqual(50000);
    expect(instagramIndicator!.avg_views).toEqual(5000);
    expect(instagramIndicator!.avg_engagement_rate).toEqual(4.5);
    expect(typeof instagramIndicator!.avg_engagement_rate).toEqual('number');
    expect(instagramIndicator!.total_posts).toEqual(100);
    expect(instagramIndicator!.id).toBeDefined();
    expect(instagramIndicator!.created_at).toBeInstanceOf(Date);
    expect(instagramIndicator!.last_updated).toBeInstanceOf(Date);

    // Verify second indicator
    const youtubeIndicator = result.find(pi => pi.platform === 'youtube');
    expect(youtubeIndicator).toBeDefined();
    expect(youtubeIndicator!.influencer_id).toEqual(influencerId);
    expect(youtubeIndicator!.followers_count).toEqual(25000);
    expect(youtubeIndicator!.avg_views).toEqual(10000);
    expect(youtubeIndicator!.avg_engagement_rate).toEqual(6.2);
    expect(typeof youtubeIndicator!.avg_engagement_rate).toEqual('number');
    expect(youtubeIndicator!.total_posts).toEqual(50);
  });

  it('should return empty array for influencer with no performance indicators', async () => {
    // Create test influencer
    const influencerResult = await db.insert(influencersTable)
      .values({
        name: 'Test Influencer',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const influencerId = influencerResult[0].id;

    const result = await getPerformanceIndicatorsByInfluencer(influencerId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle null values for optional fields correctly', async () => {
    // Create test influencer
    const influencerResult = await db.insert(influencersTable)
      .values({
        name: 'Test Influencer',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const influencerId = influencerResult[0].id;

    // Create performance indicator with null optional fields
    await db.insert(performanceIndicatorsTable)
      .values({
        influencer_id: influencerId,
        platform: 'tiktok',
        followers_count: 10000,
        avg_views: null,
        avg_engagement_rate: null,
        total_posts: null
      })
      .execute();

    const result = await getPerformanceIndicatorsByInfluencer(influencerId);

    expect(result).toHaveLength(1);
    expect(result[0].influencer_id).toEqual(influencerId);
    expect(result[0].platform).toEqual('tiktok');
    expect(result[0].followers_count).toEqual(10000);
    expect(result[0].avg_views).toBeNull();
    expect(result[0].avg_engagement_rate).toBeNull();
    expect(result[0].total_posts).toBeNull();
  });

  it('should return only performance indicators for the specified influencer', async () => {
    // Create first influencer
    const influencer1Result = await db.insert(influencersTable)
      .values({
        name: 'Influencer One',
        email: 'one@example.com'
      })
      .returning()
      .execute();

    // Create second influencer
    const influencer2Result = await db.insert(influencersTable)
      .values({
        name: 'Influencer Two',
        email: 'two@example.com'
      })
      .returning()
      .execute();

    const influencer1Id = influencer1Result[0].id;
    const influencer2Id = influencer2Result[0].id;

    // Create performance indicators for both influencers
    await db.insert(performanceIndicatorsTable)
      .values([
        {
          influencer_id: influencer1Id,
          platform: 'instagram',
          followers_count: 30000,
          avg_engagement_rate: '3.75'
        },
        {
          influencer_id: influencer1Id,
          platform: 'youtube',
          followers_count: 15000,
          avg_engagement_rate: '5.25'
        },
        {
          influencer_id: influencer2Id,
          platform: 'instagram',
          followers_count: 50000,
          avg_engagement_rate: '4.80'
        }
      ])
      .execute();

    const result = await getPerformanceIndicatorsByInfluencer(influencer1Id);

    expect(result).toHaveLength(2);
    result.forEach(indicator => {
      expect(indicator.influencer_id).toEqual(influencer1Id);
    });

    // Verify no indicators for influencer2 are returned
    const hasInfluencer2Data = result.some(indicator => indicator.influencer_id === influencer2Id);
    expect(hasInfluencer2Data).toBe(false);
  });

  it('should handle multiple platforms correctly', async () => {
    // Create test influencer
    const influencerResult = await db.insert(influencersTable)
      .values({
        name: 'Multi Platform Influencer',
        email: 'multi@example.com'
      })
      .returning()
      .execute();

    const influencerId = influencerResult[0].id;

    // Create performance indicators for all platforms
    await db.insert(performanceIndicatorsTable)
      .values([
        {
          influencer_id: influencerId,
          platform: 'instagram',
          followers_count: 10000,
          avg_engagement_rate: '2.50'
        },
        {
          influencer_id: influencerId,
          platform: 'youtube',
          followers_count: 5000,
          avg_engagement_rate: '8.75'
        },
        {
          influencer_id: influencerId,
          platform: 'tiktok',
          followers_count: 25000,
          avg_engagement_rate: '12.30'
        },
        {
          influencer_id: influencerId,
          platform: 'twitter',
          followers_count: 3000,
          avg_engagement_rate: '1.80'
        },
        {
          influencer_id: influencerId,
          platform: 'linkedin',
          followers_count: 1500,
          avg_engagement_rate: '4.20'
        }
      ])
      .execute();

    const result = await getPerformanceIndicatorsByInfluencer(influencerId);

    expect(result).toHaveLength(5);

    // Verify all platforms are represented
    const platforms = result.map(indicator => indicator.platform).sort();
    expect(platforms).toEqual(['instagram', 'linkedin', 'tiktok', 'twitter', 'youtube']);

    // Verify numeric conversion for all indicators
    result.forEach(indicator => {
      expect(typeof indicator.avg_engagement_rate).toEqual('number');
      expect(indicator.avg_engagement_rate).toBeGreaterThan(0);
    });
  });

  it('should persist data correctly in database', async () => {
    // Create test influencer
    const influencerResult = await db.insert(influencersTable)
      .values({
        name: 'Database Test Influencer',
        email: 'dbtest@example.com'
      })
      .returning()
      .execute();

    const influencerId = influencerResult[0].id;

    // Create performance indicator
    await db.insert(performanceIndicatorsTable)
      .values({
        influencer_id: influencerId,
        platform: 'facebook',
        followers_count: 8000,
        avg_views: 800,
        avg_engagement_rate: '3.25',
        total_posts: 75
      })
      .execute();

    // Fetch using handler
    const handlerResult = await getPerformanceIndicatorsByInfluencer(influencerId);

    // Verify against direct database query
    const directResult = await db.select()
      .from(performanceIndicatorsTable)
      .where(eq(performanceIndicatorsTable.influencer_id, influencerId))
      .execute();

    expect(handlerResult).toHaveLength(1);
    expect(directResult).toHaveLength(1);

    // Compare key fields
    expect(handlerResult[0].influencer_id).toEqual(directResult[0].influencer_id);
    expect(handlerResult[0].platform).toEqual(directResult[0].platform);
    expect(handlerResult[0].followers_count).toEqual(directResult[0].followers_count);
    expect(handlerResult[0].avg_views).toEqual(directResult[0].avg_views);
    expect(handlerResult[0].total_posts).toEqual(directResult[0].total_posts);

    // Verify numeric conversion
    expect(typeof handlerResult[0].avg_engagement_rate).toEqual('number');
    expect(handlerResult[0].avg_engagement_rate).toEqual(3.25);
    expect(typeof directResult[0].avg_engagement_rate).toEqual('string');
  });
});