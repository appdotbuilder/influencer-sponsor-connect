import { db } from '../db';
import { socialMediaAccountsTable, influencersTable } from '../db/schema';
import { type CreateSocialMediaAccountInput, type SocialMediaAccount } from '../schema';
import { eq } from 'drizzle-orm';

export const createSocialMediaAccount = async (input: CreateSocialMediaAccountInput): Promise<SocialMediaAccount> => {
  try {
    // Verify that the influencer exists to prevent foreign key constraint violations
    const influencerExists = await db.select({ id: influencersTable.id })
      .from(influencersTable)
      .where(eq(influencersTable.id, input.influencer_id))
      .limit(1)
      .execute();

    if (influencerExists.length === 0) {
      throw new Error(`Influencer with ID ${input.influencer_id} does not exist`);
    }

    // Insert social media account record
    const result = await db.insert(socialMediaAccountsTable)
      .values({
        influencer_id: input.influencer_id,
        platform: input.platform,
        username: input.username,
        url: input.url,
        follower_count: input.follower_count || null
      })
      .returning()
      .execute();

    const socialMediaAccount = result[0];
    return {
      ...socialMediaAccount,
      follower_count: socialMediaAccount.follower_count
    };
  } catch (error) {
    console.error('Social media account creation failed:', error);
    throw error;
  }
};