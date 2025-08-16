import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, ExternalLink, Users, Calendar, Mail, Phone, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Influencer, 
  CreateInfluencerInput,
  SocialMediaAccount,
  CreateSocialMediaAccountInput,
  PerformanceIndicators
} from '../../../server/src/schema';

interface InfluencerManagementProps {
  onStatsUpdate: () => void;
}

export default function InfluencerManagement({ onStatsUpdate }: InfluencerManagementProps) {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [socialAccountDialogOpen, setSocialAccountDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  const [formData, setFormData] = useState<CreateInfluencerInput>({
    name: '',
    email: '',
    phone: null,
    bio: null,
    portfolio_description: null
  });

  const [socialAccountData, setSocialAccountData] = useState<CreateSocialMediaAccountInput>({
    influencer_id: 0,
    platform: 'instagram',
    username: '',
    url: '',
    follower_count: null
  });

  const loadInfluencers = useCallback(async () => {
    try {
      const result = await trpc.getInfluencers.query();
      setInfluencers(result);
    } catch (error) {
      console.error('Failed to load influencers:', error);
    }
  }, []);

  useEffect(() => {
    loadInfluencers();
  }, [loadInfluencers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createInfluencer.mutate(formData);
      setInfluencers((prev: Influencer[]) => [...prev, response]);
      setFormData({
        name: '',
        email: '',
        phone: null,
        bio: null,
        portfolio_description: null
      });
      setCreateDialogOpen(false);
      onStatsUpdate();
    } catch (error) {
      console.error('Failed to create influencer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInfluencer) return;
    
    setIsLoading(true);
    try {
      await trpc.createSocialMediaAccount.mutate({
        ...socialAccountData,
        influencer_id: selectedInfluencer.id
      });
      setSocialAccountData({
        influencer_id: 0,
        platform: 'instagram',
        username: '',
        url: '',
        follower_count: null
      });
      setSocialAccountDialogOpen(false);
      // Refresh influencers to show updated social accounts
      loadInfluencers();
    } catch (error) {
      console.error('Failed to create social media account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      youtube: 'bg-red-500 text-white',
      tiktok: 'bg-black text-white',
      twitter: 'bg-blue-400 text-white',
      linkedin: 'bg-blue-600 text-white',
      facebook: 'bg-blue-500 text-white',
      other: 'bg-gray-500 text-white'
    };
    return colors[platform] || colors.other;
  };

  const getPlatformEmoji = (platform: string) => {
    const emojis: Record<string, string> = {
      instagram: '📸',
      youtube: '🎥',
      tiktok: '🎵',
      twitter: '🐦',
      linkedin: '💼',
      facebook: '👥',
      other: '🌐'
    };
    return emojis[platform] || emojis.other;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🎨 Influencer Management</h2>
          <p className="text-gray-600 mt-1">Manage content creators and their social media presence</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Influencer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Influencer Profile</DialogTitle>
              <DialogDescription>
                Add a new content creator to the platform
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInfluencerInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInfluencerInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInfluencerInput) => ({ 
                      ...prev, 
                      phone: e.target.value || null 
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself and your content..."
                  value={formData.bio || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateInfluencerInput) => ({ 
                      ...prev, 
                      bio: e.target.value || null 
                    }))
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="portfolio">Portfolio Description</Label>
                <Textarea
                  id="portfolio"
                  placeholder="Describe your past collaborations and achievements..."
                  value={formData.portfolio_description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateInfluencerInput) => ({ 
                      ...prev, 
                      portfolio_description: e.target.value || null 
                    }))
                  }
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Influencer Profile'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Social Media Account Dialog */}
      <Dialog open={socialAccountDialogOpen} onOpenChange={setSocialAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Media Account</DialogTitle>
            <DialogDescription>
              Add a social media account for {selectedInfluencer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSocialAccountSubmit} className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={socialAccountData.platform}
                onValueChange={(value: 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook' | 'other') =>
                  setSocialAccountData((prev: CreateSocialMediaAccountInput) => ({ ...prev, platform: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                  <SelectItem value="youtube">🎥 YouTube</SelectItem>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="twitter">🐦 Twitter</SelectItem>
                  <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                  <SelectItem value="facebook">👥 Facebook</SelectItem>
                  <SelectItem value="other">🌐 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="@username"
                value={socialAccountData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSocialAccountData((prev: CreateSocialMediaAccountInput) => ({ ...prev, username: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="url">Profile URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={socialAccountData.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSocialAccountData((prev: CreateSocialMediaAccountInput) => ({ ...prev, url: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="followers">Follower Count</Label>
              <Input
                id="followers"
                type="number"
                placeholder="1000"
                min="0"
                value={socialAccountData.follower_count || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSocialAccountData((prev: CreateSocialMediaAccountInput) => ({ 
                    ...prev, 
                    follower_count: parseInt(e.target.value) || null 
                  }))
                }
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Adding...' : 'Add Social Account'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Influencers List */}
      {influencers.length === 0 ? (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No influencers yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Start building your network by adding content creators to the platform
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Influencer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {influencers.map((influencer: Influencer) => (
            <Card key={influencer.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {influencer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{influencer.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Mail className="h-3 w-3" />
                        {influencer.email}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {influencer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    {influencer.phone}
                  </div>
                )}
                
                {influencer.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">{influencer.bio}</p>
                )}
                
                {influencer.portfolio_description && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-700 mb-1">Portfolio</h4>
                    <p className="text-xs text-purple-600 line-clamp-2">
                      {influencer.portfolio_description}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Joined {influencer.created_at.toLocaleDateString()}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedInfluencer(influencer);
                      setSocialAccountDialogOpen(true);
                    }}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Social
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}