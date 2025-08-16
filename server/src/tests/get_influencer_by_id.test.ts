import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { influencersTable, socialMediaAccountsTable, performanceIndicatorsTable } from '../db/schema';
import { getInfluencerById } from '../handlers/get_influencer_by_id';
import { eq } from 'drizzle-orm';

describe('getInfluencerById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return influencer by id', async () => {
    // Create test influencer
    const testInfluencer = await db.insert(influencersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        bio: 'Test bio',
        portfolio_description: 'Test portfolio'
      })
      .returning()
      .execute();

    const createdInfluencer = testInfluencer[0];
    const result = await getInfluencerById(createdInfluencer.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdInfluencer.id);
    expect(result?.name).toEqual('John Doe');
    expect(result?.email).toEqual('john@example.com');
    expect(result?.phone).toEqual('+1234567890');
    expect(result?.bio).toEqual('Test bio');
    expect(result?.portfolio_description).toEqual('Test portfolio');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent influencer', async () => {
    const result = await getInfluencerById(99999);
    expect(result).toBeNull();
  });

  it('should handle influencer with minimal data', async () => {
    // Create influencer with only required fields
    const testInfluencer = await db.insert(influencersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com'
      })
      .returning()
      .execute();

    const createdInfluencer = testInfluencer[0];
    const result = await getInfluencerById(createdInfluencer.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdInfluencer.id);
    expect(result?.name).toEqual('Jane Smith');
    expect(result?.email).toEqual('jane@example.com');
    expect(result?.phone).toBeNull();
    expect(result?.bio).toBeNull();
    expect(result?.portfolio_description).toBeNull();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct influencer when multiple exist', async () => {
    // Create multiple influencers
    const influencer1 = await db.insert(influencersTable)
      .values({
        name: 'First Influencer',
        email: 'first@example.com'
      })
      .returning()
      .execute();

    const influencer2 = await db.insert(influencersTable)
      .values({
        name: 'Second Influencer',
        email: 'second@example.com'
      })
      .returning()
      .execute();

    // Get the second influencer
    const result = await getInfluencerById(influencer2[0].id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(influencer2[0].id);
    expect(result?.name).toEqual('Second Influencer');
    expect(result?.email).toEqual('second@example.com');
  });

  it('should handle influencer with related social media accounts', async () => {
    // Create test influencer
    const testInfluencer = await db.insert(influencersTable)
      .values({
        name: 'Social Influencer',
        email: 'social@example.com'
      })
      .returning()
      .execute();

    const createdInfluencer = testInfluencer[0];

    // Create related social media accounts
    await db.insert(socialMediaAccountsTable)
      .values([
        {
          influencer_id: createdInfluencer.id,
          platform: 'instagram',
          username: 'social_user',
          url: 'https://instagram.com/social_user',
          follower_count: 10000
        },
        {
          influencer_id: createdInfluencer.id,
          platform: 'youtube',
          username: 'social_channel',
          url: 'https://youtube.com/social_channel',
          follower_count: 5000
        }
      ])
      .execute();

    const result = await getInfluencerById(createdInfluencer.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdInfluencer.id);
    expect(result?.name).toEqual('Social Influencer');
    expect(result?.email).toEqual('social@example.com');

    // Verify social media accounts exist in database
    const socialAccounts = await db.select()
      .from(socialMediaAccountsTable)
      .where(eq(socialMediaAccountsTable.influencer_id, createdInfluencer.id))
      .execute();

    expect(socialAccounts).toHaveLength(2);
    expect(socialAccounts[0].platform).toEqual('instagram');
    expect(socialAccounts[1].platform).toEqual('youtube');
  });

  it('should handle influencer with performance indicators', async () => {
    // Create test influencer
    const testInfluencer = await db.insert(influencersTable)
      .values({
        name: 'Performance Influencer',
        email: 'performance@example.com'
      })
      .returning()
      .execute();

    const createdInfluencer = testInfluencer[0];

    // Create performance indicators
    await db.insert(performanceIndicatorsTable)
      .values({
        influencer_id: createdInfluencer.id,
        platform: 'instagram',
        followers_count: 15000,
        avg_views: 2500,
        avg_engagement_rate: (4.5).toString(),
        total_posts: 120
      })
      .execute();

    const result = await getInfluencerById(createdInfluencer.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdInfluencer.id);
    expect(result?.name).toEqual('Performance Influencer');

    // Verify performance indicators exist in database
    const performanceData = await db.select()
      .from(performanceIndicatorsTable)
      .where(eq(performanceIndicatorsTable.influencer_id, createdInfluencer.id))
      .execute();

    expect(performanceData).toHaveLength(1);
    expect(performanceData[0].platform).toEqual('instagram');
    expect(performanceData[0].followers_count).toEqual(15000);
    expect(performanceData[0].avg_views).toEqual(2500);
    expect(parseFloat(performanceData[0].avg_engagement_rate!)).toEqual(4.5);
    expect(performanceData[0].total_posts).toEqual(120);
  });
});