import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateSponsorInput } from '../schema';
import { getSponsorById } from '../handlers/get_sponsor_by_id';

// Test sponsor data
const testSponsorData: CreateSponsorInput = {
  company_name: 'TechCorp Solutions',
  contact_email: 'contact@techcorp.com',
  contact_phone: '+1234567890',
  industry: 'Technology',
  description: 'Leading technology solutions provider'
};

describe('getSponsorById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return sponsor when found', async () => {
    // Create test sponsor
    const insertResult = await db.insert(sponsorsTable)
      .values(testSponsorData)
      .returning()
      .execute();

    const createdSponsor = insertResult[0];

    // Test the handler
    const result = await getSponsorById(createdSponsor.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdSponsor.id);
    expect(result!.company_name).toEqual('TechCorp Solutions');
    expect(result!.contact_email).toEqual('contact@techcorp.com');
    expect(result!.contact_phone).toEqual('+1234567890');
    expect(result!.industry).toEqual('Technology');
    expect(result!.description).toEqual('Leading technology solutions provider');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when sponsor not found', async () => {
    const result = await getSponsorById(999);
    expect(result).toBeNull();
  });

  it('should handle sponsor with null optional fields', async () => {
    // Create sponsor with minimal required fields only
    const minimalSponsorData: CreateSponsorInput = {
      company_name: 'Minimal Corp',
      contact_email: 'minimal@corp.com',
      industry: 'Services'
    };

    const insertResult = await db.insert(sponsorsTable)
      .values(minimalSponsorData)
      .returning()
      .execute();

    const createdSponsor = insertResult[0];

    // Test the handler
    const result = await getSponsorById(createdSponsor.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdSponsor.id);
    expect(result!.company_name).toEqual('Minimal Corp');
    expect(result!.contact_email).toEqual('minimal@corp.com');
    expect(result!.contact_phone).toBeNull();
    expect(result!.industry).toEqual('Services');
    expect(result!.description).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct sponsor among multiple', async () => {
    // Create multiple sponsors
    const sponsor1Data: CreateSponsorInput = {
      company_name: 'Company One',
      contact_email: 'one@company.com',
      industry: 'Finance'
    };

    const sponsor2Data: CreateSponsorInput = {
      company_name: 'Company Two',
      contact_email: 'two@company.com',
      industry: 'Healthcare'
    };

    const insertResult1 = await db.insert(sponsorsTable)
      .values(sponsor1Data)
      .returning()
      .execute();

    const insertResult2 = await db.insert(sponsorsTable)
      .values(sponsor2Data)
      .returning()
      .execute();

    const createdSponsor1 = insertResult1[0];
    const createdSponsor2 = insertResult2[0];

    // Test fetching specific sponsors
    const result1 = await getSponsorById(createdSponsor1.id);
    const result2 = await getSponsorById(createdSponsor2.id);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(createdSponsor1.id);
    expect(result1!.company_name).toEqual('Company One');
    expect(result1!.contact_email).toEqual('one@company.com');
    expect(result1!.industry).toEqual('Finance');

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(createdSponsor2.id);
    expect(result2!.company_name).toEqual('Company Two');
    expect(result2!.contact_email).toEqual('two@company.com');
    expect(result2!.industry).toEqual('Healthcare');
  });

  it('should verify database consistency', async () => {
    // Create sponsor via handler test
    const insertResult = await db.insert(sponsorsTable)
      .values(testSponsorData)
      .returning()
      .execute();

    const createdSponsor = insertResult[0];

    // Get via handler
    const handlerResult = await getSponsorById(createdSponsor.id);

    // Verify directly in database
    const dbResult = await db.select()
      .from(sponsorsTable)
      .where(eq(sponsorsTable.id, createdSponsor.id))
      .execute();

    expect(handlerResult).not.toBeNull();
    expect(dbResult).toHaveLength(1);
    expect(handlerResult!.id).toEqual(dbResult[0].id);
    expect(handlerResult!.company_name).toEqual(dbResult[0].company_name);
    expect(handlerResult!.contact_email).toEqual(dbResult[0].contact_email);
    expect(handlerResult!.industry).toEqual(dbResult[0].industry);
  });
});