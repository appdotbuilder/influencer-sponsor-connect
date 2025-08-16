import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Mail, Phone, Calendar, Package, Target } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Sponsor, 
  CreateSponsorInput,
  Product,
  CreateProductInput
} from '../../../server/src/schema';

interface SponsorManagementProps {
  onStatsUpdate: () => void;
}

export default function SponsorManagement({ onStatsUpdate }: SponsorManagementProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createSponsorDialogOpen, setCreateSponsorDialogOpen] = useState(false);
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  const [sponsorFormData, setSponsorFormData] = useState<CreateSponsorInput>({
    company_name: '',
    contact_email: '',
    contact_phone: null,
    industry: '',
    description: null
  });

  const [productFormData, setProductFormData] = useState<CreateProductInput>({
    sponsor_id: 0,
    name: '',
    description: null,
    category: '',
    target_audience: null
  });

  const loadSponsors = useCallback(async () => {
    try {
      const result = await trpc.getSponsors.query();
      setSponsors(result);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  useEffect(() => {
    loadSponsors();
    loadProducts();
  }, [loadSponsors, loadProducts]);

  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createSponsor.mutate(sponsorFormData);
      setSponsors((prev: Sponsor[]) => [...prev, response]);
      setSponsorFormData({
        company_name: '',
        contact_email: '',
        contact_phone: null,
        industry: '',
        description: null
      });
      setCreateSponsorDialogOpen(false);
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to create sponsor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSponsor) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createProduct.mutate({
        ...productFormData,
        sponsor_id: selectedSponsor.id
      });
      setProducts((prev: Product[]) => [...prev, response]);
      setProductFormData({
        sponsor_id: 0,
        name: '',
        description: null,
        category: '',
        target_audience: null
      });
      setCreateProductDialogOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIndustryColor = (industry: string) => {
    const colors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Fashion': 'bg-pink-100 text-pink-800',
      'Beauty': 'bg-purple-100 text-purple-800',
      'Health': 'bg-green-100 text-green-800',
      'Food': 'bg-orange-100 text-orange-800',
      'Travel': 'bg-cyan-100 text-cyan-800',
      'Gaming': 'bg-indigo-100 text-indigo-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Fitness': 'bg-red-100 text-red-800',
    };
    return colors[industry] || 'bg-gray-100 text-gray-800';
  };

  const getSponsorProducts = (sponsorId: number) => {
    return products.filter((product: Product) => product.sponsor_id === sponsorId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🏢 Sponsor Management</h2>
          <p className="text-gray-600 mt-1">Manage brands and their products for collaboration opportunities</p>
        </div>
        <Button 
          onClick={() => setCreateSponsorDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sponsor
        </Button>
      </div>

      {/* Create Sponsor Dialog */}
      <Dialog open={createSponsorDialogOpen} onOpenChange={setCreateSponsorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sponsor</DialogTitle>
            <DialogDescription>
              Add a new brand or company to the platform
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSponsorSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="Acme Corp"
                  value={sponsorFormData.company_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSponsorFormData((prev: CreateSponsorInput) => ({ ...prev, company_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="contact@acme.com"
                  value={sponsorFormData.contact_email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSponsorFormData((prev: CreateSponsorInput) => ({ ...prev, contact_email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  placeholder="+1 (555) 123-4567"
                  value={sponsorFormData.contact_phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSponsorFormData((prev: CreateSponsorInput) => ({ 
                      ...prev, 
                      contact_phone: e.target.value || null 
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  placeholder="Technology"
                  value={sponsorFormData.industry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSponsorFormData((prev: CreateSponsorInput) => ({ ...prev, industry: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your company and what you do..."
                value={sponsorFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSponsorFormData((prev: CreateSponsorInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating...' : 'Create Sponsor'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={createProductDialogOpen} onOpenChange={setCreateProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Add a new product for {selectedSponsor?.company_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div>
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                placeholder="Product name"
                value={productFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProductFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                placeholder="e.g., Skincare, Software, Fashion"
                value={productFormData.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProductFormData((prev: CreateProductInput) => ({ ...prev, category: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="product_description">Description</Label>
              <Textarea
                id="product_description"
                placeholder="Describe the product..."
                value={productFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setProductFormData((prev: CreateProductInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                placeholder="e.g., Young adults, Tech professionals"
                value={productFormData.target_audience || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProductFormData((prev: CreateProductInput) => ({ 
                    ...prev, 
                    target_audience: e.target.value || null 
                  }))
                }
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Adding...' : 'Add Product'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sponsors List */}
      {sponsors.length === 0 ? (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sponsors yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Start building your brand network by adding sponsors to the platform
            </p>
            <Button 
              onClick={() => setCreateSponsorDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Sponsor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor: Sponsor) => {
            const sponsorProducts = getSponsorProducts(sponsor.id);
            return (
              <Card key={sponsor.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {sponsor.company_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{sponsor.company_name}</CardTitle>
                        <Badge className={getIndustryColor(sponsor.industry)} variant="secondary">
                          {sponsor.industry}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      {sponsor.contact_email}
                    </div>
                    {sponsor.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {sponsor.contact_phone}
                      </div>
                    )}
                  </div>
                  
                  {sponsor.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{sponsor.description}</p>
                  )}

                  {sponsorProducts.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Products ({sponsorProducts.length})
                      </h4>
                      <div className="space-y-1">
                        {sponsorProducts.slice(0, 2).map((product: Product) => (
                          <div key={product.id} className="text-xs text-blue-600">
                            • {product.name} ({product.category})
                          </div>
                        ))}
                        {sponsorProducts.length > 2 && (
                          <div className="text-xs text-blue-500">
                            + {sponsorProducts.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      Joined {sponsor.created_at.toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSponsor(sponsor);
                        setCreateProductDialogOpen(true);
                      }}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}