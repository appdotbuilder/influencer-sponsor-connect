import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { type UpdateSponsorInput, type CreateSponsorInput } from '../schema';
import { updateSponsor } from '../handlers/update_sponsor';
import { eq } from 'drizzle-orm';

// Test data for creating sponsors
const baseSponsorInput: CreateSponsorInput = {
  company_name: 'Tech Corp',
  contact_email: 'contact@techcorp.com',
  contact_phone: '555-0123',
  industry: 'Technology',
  description: 'A leading technology company'
};

describe('updateSponsor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update sponsor company name', async () => {
    // Create a sponsor first
    const createResult = await db.insert(sponsorsTable)
      .values(baseSponsorInput)
      .returning()
      .execute();
    
    const sponsorId = createResult[0].id;

    // Update sponsor
    const updateInput: UpdateSponsorInput = {
      id: sponsorId,
      company_name: 'Updated Tech Corp'
    };

    const result = await updateSponsor(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(sponsorId);
    expect(result.company_name).toEqual('Updated Tech Corp');
    expect(result.contact_email).toEqual('contact@techcorp.com'); // Unchanged
    expect(result.industry).toEqual('Technology'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update sponsor contact information', async () => {
    // Create a sponsor first
    const createResult = await db.insert(sponsorsTable)
      .values(baseSponsorInput)
      .returning()
      .execute();
    
    const sponsorId = createResult[0].id;

    // Update contact info
    const updateInput: UpdateSponsorInput = {
      id: sponsorId,
      contact_email: 'newemail@techcorp.com',
      contact_phone: '555-9999'
    };

    const result = await updateSponsor(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(sponsorId);
    expect(result.contact_email).toEqual('newemail@techcorp.com');
    expect(result.contact_phone).toEqual('555-9999');
    expect(result.company_name).toEqual('Tech Corp'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create a sponsor first
    const createResult = await db.insert(sponsorsTable)
      .values(baseSponsorInput)
      .returning()
      .execute();
    
    const sponsorId = createResult[0].id;

    // Update multiple fields
    const updateInput: UpdateSponsorInput = {
      id: sponsorId,
      company_name: 'New Company Name',
      industry: 'Healthcare',
      description: 'Updated description',
      contact_phone: null // Set to null
    };

    const result = await updateSponsor(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(sponsorId);
    expect(result.company_name).toEqual('New Company Name');
    expect(result.industry).toEqual('Healthcare');
    expect(result.description).toEqual('Updated description');
    expect(result.contact_phone).toBeNull();
    expect(result.contact_email).toEqual('contact@techcorp.com'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated sponsor to database', async () => {
    // Create a sponsor first
    const createResult = await db.insert(sponsorsTable)
      .values(baseSponsorInput)
      .returning()
      .execute();
    
    const sponsorId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Update sponsor
    const updateInput: UpdateSponsorInput = {
      id: sponsorId,
      company_name: 'Database Updated Corp'
    };

    await updateSponsor(updateInput);

    // Query database directly to verify changes
    const sponsors = await db.select()
      .from(sponsorsTable)
      .where(eq(sponsorsTable.id, sponsorId))
      .execute();

    expect(sponsors).toHaveLength(1);
    expect(sponsors[0].company_name).toEqual('Database Updated Corp');
    expect(sponsors[0].updated_at > originalUpdatedAt).toBe(true);
  });

  it('should set nullable fields to null', async () => {
    // Create a sponsor first
    const createResult = await db.insert(sponsorsTable)
      .values(baseSponsorInput)
      .returning()
      .execute();
    
    const sponsorId = createResult[0].id;

    // Update nullable fields to null
    const updateInput: UpdateSponsorInput = {
      id: sponsorId,
      contact_phone: null,
      description: null
    };

    const result = await updateSponsor(updateInput);

    // Verify nullable fields are set to null
    expect(result.contact_phone).toBeNull();
    expect(result.description).toBeNull();
    expect(result.company_name).toEqual('Tech Corp'); // Unchanged
  });

  it('should update only the updated_at timestamp when no fields provided', async () => {
    // Create a sponsor first
    const createResult = await db.insert(sponsorsTable)
      .values(baseSponsorInput)
      .returning()
      .execute();
    
    const sponsorId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with only id (no fields to update)
    const updateInput: UpdateSponsorInput = {
      id: sponsorId
    };

    const result = await updateSponsor(updateInput);

    // Verify timestamp was updated but other fields remain the same
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.contact_email).toEqual('contact@techcorp.com');
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should throw error when sponsor not found', async () => {
    const updateInput: UpdateSponsorInput = {
      id: 999999, // Non-existent ID
      company_name: 'Non Existent Corp'
    };

    await expect(updateSponsor(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error for duplicate email', async () => {
    // Create two sponsors
    const sponsor1 = await db.insert(sponsorsTable)
      .values(baseSponsorInput)
      .returning()
      .execute();

    const sponsor2Input: CreateSponsorInput = {
      ...baseSponsorInput,
      contact_email: 'different@email.com',
      company_name: 'Different Corp'
    };
    
    const sponsor2 = await db.insert(sponsorsTable)
      .values(sponsor2Input)
      .returning()
      .execute();

    // Try to update sponsor2's email to match sponsor1's email
    const updateInput: UpdateSponsorInput = {
      id: sponsor2[0].id,
      contact_email: 'contact@techcorp.com' // This email already exists
    };

    await expect(updateSponsor(updateInput)).rejects.toThrow();
  });
});