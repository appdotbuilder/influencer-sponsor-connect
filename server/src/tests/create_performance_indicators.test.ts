import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { performanceIndicatorsTable, influencersTable } from '../db/schema';
import { type CreatePerformanceIndicatorsInput } from '../schema';
import { createPerformanceIndicators } from '../handlers/create_performance_indicators';
import { eq } from 'drizzle-orm';

// Test influencer data
const testInfluencer = {
  name: 'Test Influencer',
  email: 'test@example.com',
  phone: null,
  bio: 'Test bio',
  portfolio_description: 'Test portfolio'
};

// Test input with all fields
const testInput: CreatePerformanceIndicatorsInput = {
  influencer_id: 1,
  platform: 'instagram',
  followers_count: 50000,
  avg_views: 10000,
  avg_engagement_rate: 3.5,
  total_posts: 250
};

describe('createPerformanceIndicators', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create performance indicators with all fields', async () => {
    // Create test influencer first
    const influencerResult = await db.insert(influencersTable)
      .values(testInfluencer)
      .returning()
      .execute();

    const updatedInput = { ...testInput, influencer_id: influencerResult[0].id };
    const result = await createPerformanceIndicators(updatedInput);

    // Basic field validation
    expect(result.influencer_id).toEqual(influencerResult[0].id);
    expect(result.platform).toEqual('instagram');
    expect(result.followers_count).toEqual(50000);
    expect(result.avg_views).toEqual(10000);
    expect(result.avg_engagement_rate).toEqual(3.5);
    expect(typeof result.avg_engagement_rate).toBe('number');
    expect(result.total_posts).toEqual(250);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_updated).toBeInstanceOf(Date);
  });

  it('should create performance indicators with only required fields', async () => {
    // Create test influencer first
    const influencerResult = await db.insert(influencersTable)
      .values(testInfluencer)
      .returning()
      .execute();

    const minimalInput: CreatePerformanceIndicatorsInput = {
      influencer_id: influencerResult[0].id,
      platform: 'youtube',
      followers_count: 25000
    };

    const result = await createPerformanceIndicators(minimalInput);

    expect(result.influencer_id).toEqual(influencerResult[0].id);
    expect(result.platform).toEqual('youtube');
    expect(result.followers_count).toEqual(25000);
    expect(result.avg_views).toBeNull();
    expect(result.avg_engagement_rate).toBeNull();
    expect(result.total_posts).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_updated).toBeInstanceOf(Date);
  });

  it('should save performance indicators to database', async () => {
    // Create test influencer first
    const influencerResult = await db.insert(influencersTable)
      .values(testInfluencer)
      .returning()
      .execute();

    const updatedInput = { ...testInput, influencer_id: influencerResult[0].id };
    const result = await createPerformanceIndicators(updatedInput);

    // Query using proper drizzle syntax
    const performanceIndicators = await db.select()
      .from(performanceIndicatorsTable)
      .where(eq(performanceIndicatorsTable.id, result.id))
      .execute();

    expect(performanceIndicators).toHaveLength(1);
    expect(performanceIndicators[0].influencer_id).toEqual(influencerResult[0].id);
    expect(performanceIndicators[0].platform).toEqual('instagram');
    expect(performanceIndicators[0].followers_count).toEqual(50000);
    expect(performanceIndicators[0].avg_views).toEqual(10000);
    expect(parseFloat(performanceIndicators[0].avg_engagement_rate!)).toEqual(3.5);
    expect(performanceIndicators[0].total_posts).toEqual(250);
    expect(performanceIndicators[0].created_at).toBeInstanceOf(Date);
    expect(performanceIndicators[0].last_updated).toBeInstanceOf(Date);
  });

  it('should handle different platforms correctly', async () => {
    // Create test influencer first
    const influencerResult = await db.insert(influencersTable)
      .values(testInfluencer)
      .returning()
      .execute();

    const platforms = ['tiktok', 'twitter', 'linkedin', 'facebook', 'other'] as const;
    
    for (const platform of platforms) {
      const input: CreatePerformanceIndicatorsInput = {
        influencer_id: influencerResult[0].id,
        platform,
        followers_count: 1000,
        avg_engagement_rate: 2.5
      };

      const result = await createPerformanceIndicators(input);
      expect(result.platform).toEqual(platform);
      expect(result.avg_engagement_rate).toEqual(2.5);
      expect(typeof result.avg_engagement_rate).toBe('number');
    }
  });

  it('should handle zero and boundary values correctly', async () => {
    // Create test influencer first
    const influencerResult = await db.insert(influencersTable)
      .values(testInfluencer)
      .returning()
      .execute();

    const boundaryInput: CreatePerformanceIndicatorsInput = {
      influencer_id: influencerResult[0].id,
      platform: 'instagram',
      followers_count: 0, // Minimum allowed value
      avg_views: 0,
      avg_engagement_rate: 100, // Maximum allowed value
      total_posts: 0
    };

    const result = await createPerformanceIndicators(boundaryInput);

    expect(result.followers_count).toEqual(0);
    expect(result.avg_views).toEqual(0);
    expect(result.avg_engagement_rate).toEqual(100);
    expect(result.total_posts).toEqual(0);
    expect(typeof result.avg_engagement_rate).toBe('number');
  });

  it('should throw error when influencer does not exist', async () => {
    const invalidInput: CreatePerformanceIndicatorsInput = {
      influencer_id: 99999, // Non-existent influencer
      platform: 'instagram',
      followers_count: 1000
    };

    await expect(createPerformanceIndicators(invalidInput))
      .rejects.toThrow(/influencer with id 99999 not found/i);
  });

  it('should create multiple performance indicators for same influencer on different platforms', async () => {
    // Create test influencer first
    const influencerResult = await db.insert(influencersTable)
      .values(testInfluencer)
      .returning()
      .execute();

    // Create performance indicators for Instagram
    const instagramInput: CreatePerformanceIndicatorsInput = {
      influencer_id: influencerResult[0].id,
      platform: 'instagram',
      followers_count: 50000,
      avg_engagement_rate: 3.5
    };

    // Create performance indicators for YouTube
    const youtubeInput: CreatePerformanceIndicatorsInput = {
      influencer_id: influencerResult[0].id,
      platform: 'youtube',
      followers_count: 25000,
      avg_engagement_rate: 4.2
    };

    const instagramResult = await createPerformanceIndicators(instagramInput);
    const youtubeResult = await createPerformanceIndicators(youtubeInput);

    // Verify both records were created
    expect(instagramResult.platform).toEqual('instagram');
    expect(instagramResult.avg_engagement_rate).toEqual(3.5);
    expect(youtubeResult.platform).toEqual('youtube');
    expect(youtubeResult.avg_engagement_rate).toEqual(4.2);

    // Verify in database
    const allIndicators = await db.select()
      .from(performanceIndicatorsTable)
      .where(eq(performanceIndicatorsTable.influencer_id, influencerResult[0].id))
      .execute();

    expect(allIndicators).toHaveLength(2);
  });
});