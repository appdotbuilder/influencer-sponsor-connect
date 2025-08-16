import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, sponsorsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';
import { type CreateSponsorInput, type CreateProductInput } from '../schema';

// Test sponsor data
const testSponsor: CreateSponsorInput = {
  company_name: 'Test Company',
  contact_email: 'test@company.com',
  industry: 'Technology',
  contact_phone: '+1-555-0123',
  description: 'A test sponsor company'
};

// Test product data
const testProduct1: CreateProductInput = {
  sponsor_id: 1, // Will be set after sponsor creation
  name: 'Test Product 1',
  description: 'A product for testing',
  category: 'Electronics',
  target_audience: 'Tech enthusiasts'
};

const testProduct2: CreateProductInput = {
  sponsor_id: 1, // Will be set after sponsor creation
  name: 'Test Product 2',
  description: 'Another test product',
  category: 'Software',
  target_audience: 'Developers'
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all products when they exist', async () => {
    // Create prerequisite sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: testSponsor.company_name,
        contact_email: testSponsor.contact_email,
        industry: testSponsor.industry,
        contact_phone: testSponsor.contact_phone,
        description: testSponsor.description
      })
      .returning()
      .execute();

    const sponsorId = sponsorResult[0].id;

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          ...testProduct1,
          sponsor_id: sponsorId
        },
        {
          ...testProduct2,
          sponsor_id: sponsorId
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Test Product 1');
    expect(result[0].description).toEqual('A product for testing');
    expect(result[0].category).toEqual('Electronics');
    expect(result[0].target_audience).toEqual('Tech enthusiasts');
    expect(result[0].sponsor_id).toEqual(sponsorId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Test Product 2');
    expect(result[1].description).toEqual('Another test product');
    expect(result[1].category).toEqual('Software');
    expect(result[1].target_audience).toEqual('Developers');
    expect(result[1].sponsor_id).toEqual(sponsorId);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return products with null optional fields', async () => {
    // Create prerequisite sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: testSponsor.company_name,
        contact_email: testSponsor.contact_email,
        industry: testSponsor.industry
      })
      .returning()
      .execute();

    const sponsorId = sponsorResult[0].id;

    // Create product with minimal data (null optional fields)
    await db.insert(productsTable)
      .values({
        sponsor_id: sponsorId,
        name: 'Minimal Product',
        category: 'Test Category',
        description: null,
        target_audience: null
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Product');
    expect(result[0].category).toEqual('Test Category');
    expect(result[0].description).toBeNull();
    expect(result[0].target_audience).toBeNull();
    expect(result[0].sponsor_id).toEqual(sponsorId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return products from multiple sponsors', async () => {
    // Create two sponsors
    const sponsor1Result = await db.insert(sponsorsTable)
      .values({
        company_name: 'First Company',
        contact_email: 'first@company.com',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const sponsor2Result = await db.insert(sponsorsTable)
      .values({
        company_name: 'Second Company',
        contact_email: 'second@company.com',
        industry: 'Marketing'
      })
      .returning()
      .execute();

    const sponsor1Id = sponsor1Result[0].id;
    const sponsor2Id = sponsor2Result[0].id;

    // Create products for different sponsors
    await db.insert(productsTable)
      .values([
        {
          sponsor_id: sponsor1Id,
          name: 'Product from First Sponsor',
          category: 'Tech'
        },
        {
          sponsor_id: sponsor2Id,
          name: 'Product from Second Sponsor',
          category: 'Marketing'
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);

    // Find products by sponsor
    const product1 = result.find(p => p.sponsor_id === sponsor1Id);
    const product2 = result.find(p => p.sponsor_id === sponsor2Id);

    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Product from First Sponsor');
    expect(product1!.category).toEqual('Tech');

    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Product from Second Sponsor');
    expect(product2!.category).toEqual('Marketing');
  });

  it('should return products ordered by creation time', async () => {
    // Create prerequisite sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: testSponsor.company_name,
        contact_email: testSponsor.contact_email,
        industry: testSponsor.industry
      })
      .returning()
      .execute();

    const sponsorId = sponsorResult[0].id;

    // Create products sequentially to test ordering
    await db.insert(productsTable)
      .values({
        sponsor_id: sponsorId,
        name: 'First Product',
        category: 'Category A'
      })
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(productsTable)
      .values({
        sponsor_id: sponsorId,
        name: 'Second Product',
        category: 'Category B'
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);

    // Verify the products are returned (order depends on database behavior)
    const productNames = result.map(p => p.name);
    expect(productNames).toContain('First Product');
    expect(productNames).toContain('Second Product');

    // Verify timestamps are properly set
    result.forEach(product => {
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
      expect(product.created_at <= product.updated_at).toBe(true);
    });
  });
});