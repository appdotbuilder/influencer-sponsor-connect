import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialMediaAccountsTable, influencersTable } from '../db/schema';
import { type CreateSocialMediaAccountInput } from '../schema';
import { createSocialMediaAccount } from '../handlers/create_social_media_account';
import { eq } from 'drizzle-orm';

describe('createSocialMediaAccount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testInfluencerId: number;

  beforeEach(async () => {
    // Create a test influencer first
    const influencerResult = await db.insert(influencersTable)
      .values({
        name: 'Test Influencer',
        email: 'test@example.com',
        phone: null,
        bio: null,
        portfolio_description: null
      })
      .returning()
      .execute();

    testInfluencerId = influencerResult[0].id;
  });

  const testInput: CreateSocialMediaAccountInput = {
    influencer_id: 0, // Will be set dynamically
    platform: 'instagram',
    username: 'test_user',
    url: 'https://instagram.com/test_user',
    follower_count: 10000
  };

  it('should create a social media account', async () => {
    const input = { ...testInput, influencer_id: testInfluencerId };
    const result = await createSocialMediaAccount(input);

    // Basic field validation
    expect(result.influencer_id).toEqual(testInfluencerId);
    expect(result.platform).toEqual('instagram');
    expect(result.username).toEqual('test_user');
    expect(result.url).toEqual('https://instagram.com/test_user');
    expect(result.follower_count).toEqual(10000);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save social media account to database', async () => {
    const input = { ...testInput, influencer_id: testInfluencerId };
    const result = await createSocialMediaAccount(input);

    // Query using proper drizzle syntax
    const socialMediaAccounts = await db.select()
      .from(socialMediaAccountsTable)
      .where(eq(socialMediaAccountsTable.id, result.id))
      .execute();

    expect(socialMediaAccounts).toHaveLength(1);
    expect(socialMediaAccounts[0].influencer_id).toEqual(testInfluencerId);
    expect(socialMediaAccounts[0].platform).toEqual('instagram');
    expect(socialMediaAccounts[0].username).toEqual('test_user');
    expect(socialMediaAccounts[0].url).toEqual('https://instagram.com/test_user');
    expect(socialMediaAccounts[0].follower_count).toEqual(10000);
    expect(socialMediaAccounts[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null follower count', async () => {
    const inputWithoutFollowers: CreateSocialMediaAccountInput = {
      influencer_id: testInfluencerId,
      platform: 'youtube',
      username: 'test_channel',
      url: 'https://youtube.com/test_channel'
      // follower_count is optional and undefined
    };

    const result = await createSocialMediaAccount(inputWithoutFollowers);

    expect(result.follower_count).toBeNull();
    expect(result.platform).toEqual('youtube');
    expect(result.username).toEqual('test_channel');
    expect(result.url).toEqual('https://youtube.com/test_channel');

    // Verify in database
    const socialMediaAccounts = await db.select()
      .from(socialMediaAccountsTable)
      .where(eq(socialMediaAccountsTable.id, result.id))
      .execute();

    expect(socialMediaAccounts[0].follower_count).toBeNull();
  });

  it('should create multiple accounts for same influencer', async () => {
    const instagramInput: CreateSocialMediaAccountInput = {
      influencer_id: testInfluencerId,
      platform: 'instagram',
      username: 'insta_user',
      url: 'https://instagram.com/insta_user',
      follower_count: 5000
    };

    const tiktokInput: CreateSocialMediaAccountInput = {
      influencer_id: testInfluencerId,
      platform: 'tiktok',
      username: 'tiktok_user',
      url: 'https://tiktok.com/@tiktok_user',
      follower_count: 15000
    };

    const instagramResult = await createSocialMediaAccount(instagramInput);
    const tiktokResult = await createSocialMediaAccount(tiktokInput);

    expect(instagramResult.platform).toEqual('instagram');
    expect(tiktokResult.platform).toEqual('tiktok');
    expect(instagramResult.influencer_id).toEqual(testInfluencerId);
    expect(tiktokResult.influencer_id).toEqual(testInfluencerId);

    // Verify both accounts exist in database
    const allAccounts = await db.select()
      .from(socialMediaAccountsTable)
      .where(eq(socialMediaAccountsTable.influencer_id, testInfluencerId))
      .execute();

    expect(allAccounts).toHaveLength(2);
  });

  it('should throw error for non-existent influencer', async () => {
    const invalidInput: CreateSocialMediaAccountInput = {
      influencer_id: 99999, // Non-existent ID
      platform: 'twitter',
      username: 'test_twitter',
      url: 'https://twitter.com/test_twitter',
      follower_count: 2000
    };

    await expect(createSocialMediaAccount(invalidInput)).rejects.toThrow(/Influencer with ID 99999 does not exist/i);
  });

  it('should handle different social media platforms', async () => {
    const platforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other'] as const;
    
    for (const platform of platforms) {
      const input: CreateSocialMediaAccountInput = {
        influencer_id: testInfluencerId,
        platform: platform,
        username: `${platform}_user`,
        url: `https://${platform}.com/${platform}_user`,
        follower_count: 1000
      };

      const result = await createSocialMediaAccount(input);
      expect(result.platform).toEqual(platform);
      expect(result.username).toEqual(`${platform}_user`);
    }

    // Verify all platforms were created
    const allAccounts = await db.select()
      .from(socialMediaAccountsTable)
      .where(eq(socialMediaAccountsTable.influencer_id, testInfluencerId))
      .execute();

    expect(allAccounts).toHaveLength(platforms.length);
  });
});