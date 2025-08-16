import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, sponsorsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test data
const testSponsor = {
  company_name: 'Tech Corp',
  contact_email: 'contact@techcorp.com',
  industry: 'Technology',
  description: 'A leading tech company'
};

const testInput: CreateProductInput = {
  sponsor_id: 1, // Will be set after creating sponsor
  name: 'Smart Widget',
  description: 'An innovative smart widget for modern users',
  category: 'Electronics',
  target_audience: 'Tech enthusiasts aged 25-40'
};

const minimalInput: CreateProductInput = {
  sponsor_id: 1,
  name: 'Basic Product',
  category: 'General'
  // Optional fields omitted
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    // Create a sponsor first
    const sponsorResult = await db.insert(sponsorsTable)
      .values(testSponsor)
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    const input = { ...testInput, sponsor_id: sponsorId };
    const result = await createProduct(input);

    // Basic field validation
    expect(result.name).toEqual('Smart Widget');
    expect(result.description).toEqual('An innovative smart widget for modern users');
    expect(result.category).toEqual('Electronics');
    expect(result.target_audience).toEqual('Tech enthusiasts aged 25-40');
    expect(result.sponsor_id).toEqual(sponsorId);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with minimal fields', async () => {
    // Create a sponsor first
    const sponsorResult = await db.insert(sponsorsTable)
      .values(testSponsor)
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    const input = { ...minimalInput, sponsor_id: sponsorId };
    const result = await createProduct(input);

    // Validate required fields
    expect(result.name).toEqual('Basic Product');
    expect(result.category).toEqual('General');
    expect(result.sponsor_id).toEqual(sponsorId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Optional fields should be null
    expect(result.description).toBeNull();
    expect(result.target_audience).toBeNull();
  });

  it('should save product to database', async () => {
    // Create a sponsor first
    const sponsorResult = await db.insert(sponsorsTable)
      .values(testSponsor)
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    const input = { ...testInput, sponsor_id: sponsorId };
    const result = await createProduct(input);

    // Query the database to verify the product was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Smart Widget');
    expect(products[0].description).toEqual('An innovative smart widget for modern users');
    expect(products[0].category).toEqual('Electronics');
    expect(products[0].target_audience).toEqual('Tech enthusiasts aged 25-40');
    expect(products[0].sponsor_id).toEqual(sponsorId);
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint when sponsor does not exist', async () => {
    const input = { ...testInput, sponsor_id: 999 }; // Non-existent sponsor

    await expect(createProduct(input)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple products for the same sponsor', async () => {
    // Create a sponsor first
    const sponsorResult = await db.insert(sponsorsTable)
      .values(testSponsor)
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    // Create first product
    const input1 = { ...testInput, sponsor_id: sponsorId, name: 'Product 1' };
    const result1 = await createProduct(input1);

    // Create second product
    const input2 = { ...testInput, sponsor_id: sponsorId, name: 'Product 2' };
    const result2 = await createProduct(input2);

    // Verify both products exist and have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Product 1');
    expect(result2.name).toEqual('Product 2');
    expect(result1.sponsor_id).toEqual(sponsorId);
    expect(result2.sponsor_id).toEqual(sponsorId);

    // Verify both are in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sponsor_id, sponsorId))
      .execute();

    expect(products).toHaveLength(2);
  });

  it('should handle special characters in product fields', async () => {
    // Create a sponsor first
    const sponsorResult = await db.insert(sponsorsTable)
      .values(testSponsor)
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    const specialInput: CreateProductInput = {
      sponsor_id: sponsorId,
      name: 'Product with "quotes" & symbols!',
      description: 'Description with émojis 🎉 and special chars: @#$%',
      category: 'Special/Category',
      target_audience: 'Users with "complex" needs'
    };

    const result = await createProduct(specialInput);

    expect(result.name).toEqual('Product with "quotes" & symbols!');
    expect(result.description).toEqual('Description with émojis 🎉 and special chars: @#$%');
    expect(result.category).toEqual('Special/Category');
    expect(result.target_audience).toEqual('Users with "complex" needs');
  });
});