import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { type CreateSponsorInput } from '../schema';
import { createSponsor } from '../handlers/create_sponsor';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateSponsorInput = {
  company_name: 'TechCorp Solutions',
  contact_email: 'contact@techcorp.com',
  contact_phone: '+1-555-0123',
  industry: 'Technology',
  description: 'Leading software development company'
};

// Minimal test input (only required fields)
const minimalInput: CreateSponsorInput = {
  company_name: 'MinimalCorp',
  contact_email: 'minimal@example.com',
  industry: 'Consulting'
};

describe('createSponsor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a sponsor with all fields', async () => {
    const result = await createSponsor(testInput);

    // Basic field validation
    expect(result.company_name).toEqual('TechCorp Solutions');
    expect(result.contact_email).toEqual('contact@techcorp.com');
    expect(result.contact_phone).toEqual('+1-555-0123');
    expect(result.industry).toEqual('Technology');
    expect(result.description).toEqual('Leading software development company');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a sponsor with minimal fields', async () => {
    const result = await createSponsor(minimalInput);

    // Validate required fields
    expect(result.company_name).toEqual('MinimalCorp');
    expect(result.contact_email).toEqual('minimal@example.com');
    expect(result.industry).toEqual('Consulting');
    
    // Validate optional fields are null
    expect(result.contact_phone).toBeNull();
    expect(result.description).toBeNull();
    
    // Validate generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save sponsor to database', async () => {
    const result = await createSponsor(testInput);

    // Query database to verify persistence
    const sponsors = await db.select()
      .from(sponsorsTable)
      .where(eq(sponsorsTable.id, result.id))
      .execute();

    expect(sponsors).toHaveLength(1);
    const dbSponsor = sponsors[0];
    expect(dbSponsor.company_name).toEqual('TechCorp Solutions');
    expect(dbSponsor.contact_email).toEqual('contact@techcorp.com');
    expect(dbSponsor.contact_phone).toEqual('+1-555-0123');
    expect(dbSponsor.industry).toEqual('Technology');
    expect(dbSponsor.description).toEqual('Leading software development company');
    expect(dbSponsor.created_at).toBeInstanceOf(Date);
    expect(dbSponsor.updated_at).toBeInstanceOf(Date);
  });

  it('should handle unique email constraint violation', async () => {
    // Create first sponsor
    await createSponsor(testInput);

    // Attempt to create another sponsor with same email
    const duplicateEmailInput: CreateSponsorInput = {
      company_name: 'Different Company',
      contact_email: 'contact@techcorp.com', // Same email as first sponsor
      industry: 'Healthcare'
    };

    await expect(createSponsor(duplicateEmailInput))
      .rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle optional fields properly', async () => {
    // Test with undefined optional fields
    const inputWithUndefined: CreateSponsorInput = {
      company_name: 'UndefinedCorp',
      contact_email: 'undefined@example.com',
      industry: 'Finance',
      contact_phone: undefined,
      description: undefined
    };

    const result = await createSponsor(inputWithUndefined);

    expect(result.company_name).toEqual('UndefinedCorp');
    expect(result.contact_email).toEqual('undefined@example.com');
    expect(result.industry).toEqual('Finance');
    expect(result.contact_phone).toBeNull();
    expect(result.description).toBeNull();
  });

  it('should create multiple sponsors with different data', async () => {
    const sponsor1Input: CreateSponsorInput = {
      company_name: 'First Corp',
      contact_email: 'first@example.com',
      industry: 'Technology'
    };

    const sponsor2Input: CreateSponsorInput = {
      company_name: 'Second Corp',
      contact_email: 'second@example.com',
      contact_phone: '+1-555-9999',
      industry: 'Healthcare',
      description: 'Medical device company'
    };

    const result1 = await createSponsor(sponsor1Input);
    const result2 = await createSponsor(sponsor2Input);

    // Validate both sponsors were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.company_name).toEqual('First Corp');
    expect(result2.company_name).toEqual('Second Corp');

    // Verify both exist in database
    const allSponsors = await db.select()
      .from(sponsorsTable)
      .execute();

    expect(allSponsors).toHaveLength(2);
    
    const emails = allSponsors.map(s => s.contact_email);
    expect(emails).toContain('first@example.com');
    expect(emails).toContain('second@example.com');
  });
});