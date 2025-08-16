import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sponsorsTable } from '../db/schema';
import { type CreateSponsorInput } from '../schema';
import { getSponsors } from '../handlers/get_sponsors';

// Test data
const testSponsors: CreateSponsorInput[] = [
  {
    company_name: 'Tech Innovation Corp',
    contact_email: 'contact@techinnovation.com',
    contact_phone: '+1-555-0101',
    industry: 'Technology',
    description: 'Leading technology company specializing in AI solutions'
  },
  {
    company_name: 'Fashion Forward Ltd',
    contact_email: 'hello@fashionforward.com',
    contact_phone: null,
    industry: 'Fashion',
    description: 'Premium fashion brand for modern consumers'
  },
  {
    company_name: 'Health Plus',
    contact_email: 'info@healthplus.com',
    industry: 'Healthcare',
    description: null
  }
];

describe('getSponsors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sponsors exist', async () => {
    const result = await getSponsors();

    expect(result).toEqual([]);
  });

  it('should return all sponsors', async () => {
    // Insert test sponsors
    await db.insert(sponsorsTable)
      .values(testSponsors)
      .execute();

    const result = await getSponsors();

    expect(result).toHaveLength(3);
    
    // Verify first sponsor
    const techSponsor = result.find(s => s.company_name === 'Tech Innovation Corp');
    expect(techSponsor).toBeDefined();
    expect(techSponsor!.contact_email).toBe('contact@techinnovation.com');
    expect(techSponsor!.contact_phone).toBe('+1-555-0101');
    expect(techSponsor!.industry).toBe('Technology');
    expect(techSponsor!.description).toBe('Leading technology company specializing in AI solutions');

    // Verify second sponsor with null phone
    const fashionSponsor = result.find(s => s.company_name === 'Fashion Forward Ltd');
    expect(fashionSponsor).toBeDefined();
    expect(fashionSponsor!.contact_phone).toBeNull();
    expect(fashionSponsor!.industry).toBe('Fashion');

    // Verify third sponsor with null description
    const healthSponsor = result.find(s => s.company_name === 'Health Plus');
    expect(healthSponsor).toBeDefined();
    expect(healthSponsor!.description).toBeNull();
  });

  it('should return sponsors with proper field types', async () => {
    // Insert single sponsor
    await db.insert(sponsorsTable)
      .values(testSponsors[0])
      .execute();

    const result = await getSponsors();

    expect(result).toHaveLength(1);
    const sponsor = result[0];

    // Verify field types
    expect(typeof sponsor.id).toBe('number');
    expect(typeof sponsor.company_name).toBe('string');
    expect(typeof sponsor.contact_email).toBe('string');
    expect(typeof sponsor.industry).toBe('string');
    expect(sponsor.created_at).toBeInstanceOf(Date);
    expect(sponsor.updated_at).toBeInstanceOf(Date);

    // Verify nullable fields
    if (sponsor.contact_phone !== null) {
      expect(typeof sponsor.contact_phone).toBe('string');
    }
    if (sponsor.description !== null) {
      expect(typeof sponsor.description).toBe('string');
    }
  });

  it('should handle multiple sponsors with different nullable field combinations', async () => {
    // Insert sponsors with different nullable field combinations
    const variousSponsors = [
      {
        company_name: 'Complete Info Corp',
        contact_email: 'complete@info.com',
        contact_phone: '+1-555-1111',
        industry: 'Consulting',
        description: 'Full service consulting company'
      },
      {
        company_name: 'No Phone Corp',
        contact_email: 'nophone@corp.com',
        contact_phone: null,
        industry: 'Finance',
        description: 'Financial services provider'
      },
      {
        company_name: 'No Description Corp',
        contact_email: 'nodesc@corp.com',
        contact_phone: '+1-555-2222',
        industry: 'Marketing',
        description: null
      },
      {
        company_name: 'Minimal Info Corp',
        contact_email: 'minimal@corp.com',
        contact_phone: null,
        industry: 'Education',
        description: null
      }
    ];

    await db.insert(sponsorsTable)
      .values(variousSponsors)
      .execute();

    const result = await getSponsors();

    expect(result).toHaveLength(4);

    // Verify each combination
    const completeInfo = result.find(s => s.company_name === 'Complete Info Corp');
    expect(completeInfo!.contact_phone).toBe('+1-555-1111');
    expect(completeInfo!.description).toBe('Full service consulting company');

    const noPhone = result.find(s => s.company_name === 'No Phone Corp');
    expect(noPhone!.contact_phone).toBeNull();
    expect(noPhone!.description).toBe('Financial services provider');

    const noDesc = result.find(s => s.company_name === 'No Description Corp');
    expect(noDesc!.contact_phone).toBe('+1-555-2222');
    expect(noDesc!.description).toBeNull();

    const minimal = result.find(s => s.company_name === 'Minimal Info Corp');
    expect(minimal!.contact_phone).toBeNull();
    expect(minimal!.description).toBeNull();
  });

  it('should preserve sponsor ordering from database', async () => {
    // Insert sponsors in specific order
    const orderedSponsors = [
      {
        company_name: 'Alpha Corp',
        contact_email: 'alpha@corp.com',
        industry: 'Technology'
      },
      {
        company_name: 'Beta Inc',
        contact_email: 'beta@inc.com',
        industry: 'Finance'
      },
      {
        company_name: 'Gamma Ltd',
        contact_email: 'gamma@ltd.com',
        industry: 'Healthcare'
      }
    ];

    await db.insert(sponsorsTable)
      .values(orderedSponsors)
      .execute();

    const result = await getSponsors();

    expect(result).toHaveLength(3);
    
    // Results should be ordered by ID (insertion order)
    expect(result[0].company_name).toBe('Alpha Corp');
    expect(result[1].company_name).toBe('Beta Inc');
    expect(result[2].company_name).toBe('Gamma Ltd');

    // Verify IDs are sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });

  it('should handle sponsors with unique email constraint', async () => {
    const uniqueSponsors = [
      {
        company_name: 'Unique Email Corp 1',
        contact_email: 'unique1@test.com',
        industry: 'Tech'
      },
      {
        company_name: 'Unique Email Corp 2',
        contact_email: 'unique2@test.com',
        industry: 'Finance'
      }
    ];

    await db.insert(sponsorsTable)
      .values(uniqueSponsors)
      .execute();

    const result = await getSponsors();

    expect(result).toHaveLength(2);
    
    const emails = result.map(s => s.contact_email);
    expect(emails).toContain('unique1@test.com');
    expect(emails).toContain('unique2@test.com');
    
    // Verify emails are unique
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);
  });
});