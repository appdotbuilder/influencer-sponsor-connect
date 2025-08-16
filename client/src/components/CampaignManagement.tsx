import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Target, DollarSign, Calendar, Building2, Package, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Campaign,
  CreateCampaignInput,
  Sponsor,
  Product
} from '../../../server/src/schema';

interface CampaignManagementProps {
  onStatsUpdate: () => void;
}

export default function CampaignManagement({ onStatsUpdate }: CampaignManagementProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateCampaignInput>({
    sponsor_id: 0,
    product_id: 0,
    title: '',
    description: null,
    budget: 1000,
    target_audience: null,
    objectives: null,
    status: 'draft',
    start_date: null,
    end_date: null
  });

  const loadCampaigns = useCallback(async () => {
    try {
      const result = await trpc.getCampaigns.query();
      setCampaigns(result);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }, []);

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
    loadCampaigns();
    loadSponsors();
    loadProducts();
  }, [loadCampaigns, loadSponsors, loadProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCampaign.mutate(formData);
      setCampaigns((prev: Campaign[]) => [...prev, response]);
      setFormData({
        sponsor_id: 0,
        product_id: 0,
        title: '',
        description: null,
        budget: 1000,
        target_audience: null,
        objectives: null,
        status: 'draft',
        start_date: null,
        end_date: null
      });
      setSelectedSponsorId(null);
      setCreateDialogOpen(false);
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusEmoji = (status: string) => {
    const emojis: Record<string, string> = {
      draft: '📝',
      active: '🚀',
      paused: '⏸️',
      completed: '✅',
      cancelled: '❌'
    };
    return emojis[status] || emojis.draft;
  };

  const getSponsorName = (sponsorId: number) => {
    const sponsor = sponsors.find((s: Sponsor) => s.id === sponsorId);
    return sponsor?.company_name || 'Unknown Sponsor';
  };

  const getProductName = (productId: number) => {
    const product = products.find((p: Product) => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getSponsorProducts = (sponsorId: number) => {
    return products.filter((product: Product) => product.sponsor_id === sponsorId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🎯 Campaign Management</h2>
          <p className="text-gray-600 mt-1">Create and manage collaboration opportunities</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Create a new collaboration opportunity for influencers
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sponsor">Sponsor *</Label>
                  <Select
                    value={formData.sponsor_id.toString()}
                    onValueChange={(value: string) => {
                      const sponsorId = parseInt(value);
                      setFormData((prev: CreateCampaignInput) => ({ 
                        ...prev, 
                        sponsor_id: sponsorId,
                        product_id: 0 // Reset product when sponsor changes
                      }));
                      setSelectedSponsorId(sponsorId);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sponsors.map((sponsor: Sponsor) => (
                        <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                          {sponsor.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product">Product *</Label>
                  <Select
                    value={formData.product_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateCampaignInput) => ({ 
                        ...prev, 
                        product_id: parseInt(value) 
                      }))
                    }
                    disabled={!selectedSponsorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedSponsorId ? "Select a product" : "Select sponsor first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSponsorId && getSponsorProducts(selectedSponsorId).map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="Summer Collection Launch Campaign"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCampaignInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (USD) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCampaignInput) => ({ 
                        ...prev, 
                        budget: parseFloat(e.target.value) || 1000 
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled') =>
                      setFormData((prev: CreateCampaignInput) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">📝 Draft</SelectItem>
                      <SelectItem value="active">🚀 Active</SelectItem>
                      <SelectItem value="paused">⏸️ Paused</SelectItem>
                      <SelectItem value="completed">✅ Completed</SelectItem>
                      <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCampaignInput) => ({ 
                        ...prev, 
                        start_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCampaignInput) => ({ 
                        ...prev, 
                        end_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the campaign goals and requirements..."
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateCampaignInput) => ({ 
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
                  placeholder="e.g., Young adults 18-35, Fashion enthusiasts"
                  value={formData.target_audience || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCampaignInput) => ({ 
                      ...prev, 
                      target_audience: e.target.value || null 
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="objectives">Campaign Objectives</Label>
                <Textarea
                  id="objectives"
                  placeholder="What do you want to achieve with this campaign?"
                  value={formData.objectives || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateCampaignInput) => ({ 
                      ...prev, 
                      objectives: e.target.value || null 
                    }))
                  }
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !formData.sponsor_id || !formData.product_id} 
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Campaign'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Create collaboration opportunities for influencers to discover
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: Campaign) => (
            <Card key={campaign.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(campaign.status)} variant="secondary">
                        {getStatusEmoji(campaign.status)} {campaign.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-3 w-3" />
                    {getSponsorName(campaign.sponsor_id)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-3 w-3" />
                    {getProductName(campaign.product_id)}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <DollarSign className="h-3 w-3" />
                    ${campaign.budget.toLocaleString()} budget
                  </div>
                </div>

                {campaign.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{campaign.description}</p>
                )}

                {campaign.target_audience && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Target Audience
                    </h4>
                    <p className="text-xs text-green-600">{campaign.target_audience}</p>
                  </div>
                )}

                {campaign.objectives && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Objectives
                    </h4>
                    <p className="text-xs text-blue-600 line-clamp-2">{campaign.objectives}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {campaign.start_date 
                      ? `Starts ${campaign.start_date.toLocaleDateString()}`
                      : `Created ${campaign.created_at.toLocaleDateString()}`
                    }
                  </div>
                  {campaign.status === 'active' && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Live
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}