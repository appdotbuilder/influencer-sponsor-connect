import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { influencersTable } from '../db/schema';
import { type UpdateInfluencerInput, type CreateInfluencerInput } from '../schema';
import { updateInfluencer } from '../handlers/update_influencer';
import { eq } from 'drizzle-orm';

// Helper function to create a test influencer
const createTestInfluencer = async (): Promise<number> => {
  const testInfluencer: CreateInfluencerInput = {
    name: 'Test Influencer',
    email: 'test@example.com',
    phone: '+1234567890',
    bio: 'Test bio',
    portfolio_description: 'Test portfolio'
  };

  const result = await db.insert(influencersTable)
    .values({
      name: testInfluencer.name,
      email: testInfluencer.email,
      phone: testInfluencer.phone,
      bio: testInfluencer.bio,
      portfolio_description: testInfluencer.portfolio_description
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateInfluencer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update influencer name', async () => {
    const influencerId = await createTestInfluencer();
    
    const updateInput: UpdateInfluencerInput = {
      id: influencerId,
      name: 'Updated Name'
    };

    const result = await updateInfluencer(updateInput);

    expect(result.id).toEqual(influencerId);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update influencer email', async () => {
    const influencerId = await createTestInfluencer();
    
    const updateInput: UpdateInfluencerInput = {
      id: influencerId,
      email: 'updated@example.com'
    };

    const result = await updateInfluencer(updateInput);

    expect(result.id).toEqual(influencerId);
    expect(result.name).toEqual('Test Influencer'); // Should remain unchanged
    expect(result.email).toEqual('updated@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields simultaneously', async () => {
    const influencerId = await createTestInfluencer();
    
    const updateInput: UpdateInfluencerInput = {
      id: influencerId,
      name: 'Multi Update Name',
      email: 'multi@example.com',
      phone: '+9876543210',
      bio: 'Updated bio content'
    };

    const result = await updateInfluencer(updateInput);

    expect(result.id).toEqual(influencerId);
    expect(result.name).toEqual('Multi Update Name');
    expect(result.email).toEqual('multi@example.com');
    expect(result.phone).toEqual('+9876543210');
    expect(result.bio).toEqual('Updated bio content');
    expect(result.portfolio_description).toEqual('Test portfolio'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update nullable fields to null', async () => {
    const influencerId = await createTestInfluencer();
    
    const updateInput: UpdateInfluencerInput = {
      id: influencerId,
      phone: null,
      bio: null,
      portfolio_description: null
    };

    const result = await updateInfluencer(updateInput);

    expect(result.id).toEqual(influencerId);
    expect(result.name).toEqual('Test Influencer'); // Should remain unchanged
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.phone).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.portfolio_description).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    const influencerId = await createTestInfluencer();
    
    // Get original timestamp
    const originalInfluencer = await db.select()
      .from(influencersTable)
      .where(eq(influencersTable.id, influencerId))
      .execute();

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateInfluencerInput = {
      id: influencerId,
      name: 'Updated for timestamp test'
    };

    const result = await updateInfluencer(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalInfluencer[0].updated_at.getTime());
  });

  it('should save updated data to database', async () => {
    const influencerId = await createTestInfluencer();
    
    const updateInput: UpdateInfluencerInput = {
      id: influencerId,
      name: 'DB Verification Name',
      email: 'dbverify@example.com'
    };

    await updateInfluencer(updateInput);

    // Verify data was actually saved to database
    const savedInfluencer = await db.select()
      .from(influencersTable)
      .where(eq(influencersTable.id, influencerId))
      .execute();

    expect(savedInfluencer).toHaveLength(1);
    expect(savedInfluencer[0].name).toEqual('DB Verification Name');
    expect(savedInfluencer[0].email).toEqual('dbverify@example.com');
    expect(savedInfluencer[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when influencer does not exist', async () => {
    const updateInput: UpdateInfluencerInput = {
      id: 99999, // Non-existent ID
      name: 'This should fail'
    };

    await expect(updateInfluencer(updateInput)).rejects.toThrow(/influencer with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const influencerId = await createTestInfluencer();
    
    // Update only one field
    const updateInput: UpdateInfluencerInput = {
      id: influencerId,
      bio: 'Only bio updated'
    };

    const result = await updateInfluencer(updateInput);

    expect(result.id).toEqual(influencerId);
    expect(result.name).toEqual('Test Influencer'); // Original value preserved
    expect(result.email).toEqual('test@example.com'); // Original value preserved
    expect(result.phone).toEqual('+1234567890'); // Original value preserved
    expect(result.bio).toEqual('Only bio updated'); // Updated value
    expect(result.portfolio_description).toEqual('Test portfolio'); // Original value preserved
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});