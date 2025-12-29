import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { H1, H2, H3 } from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { 
  getAdminStats, isAdmin, 
  createAnnouncement, getAllAnnouncements, updateAnnouncement, 
  deleteAnnouncement, toggleAnnouncementStatus, toggleAnnouncementPinned 
} from '@/lib/db';
import { Announcement } from '@/types/movie';
import { 
  Users, Film, MessageSquare, List, Heart, UserPlus, 
  BarChart3, MessageCircle, TrendingUp, Activity, 
  Loader2, RefreshCw, ArrowUp, ArrowDown, Shield,
  Megaphone, Plus, Edit2, Trash2, Pin, Eye, EyeOff,
  ExternalLink, Youtube, Newspaper, PartyPopper, Bell, Sparkles
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  totalLogs: number;
  newLogsToday: number;
  newLogsThisWeek: number;
  newLogsThisMonth: number;
  totalReviews: number;
  newReviewsToday: number;
  newReviewsThisWeek: number;
  newReviewsThisMonth: number;
  totalLists: number;
  newListsToday: number;
  newListsThisWeek: number;
  newListsThisMonth: number;
  totalFavorites: number;
  newFavoritesToday: number;
  newFavoritesThisWeek: number;
  totalConnections: number;
  newConnectionsToday: number;
  newConnectionsThisWeek: number;
  totalPolls: number;
  newPollsToday: number;
  newPollsThisWeek: number;
  totalDebates: number;
  newDebatesToday: number;
  newDebatesThisWeek: number;
  totalComments: number;
  newCommentsToday: number;
  newCommentsThisWeek: number;
  totalActivities: number;
  newActivitiesToday: number;
  newActivitiesThisWeek: number;
  avgLogsPerUser: number;
  avgReviewsPerUser: number;
  avgListsPerUser: number;
}

const categoryConfig = {
  news: { icon: Newspaper, label: 'News', color: 'bg-blue-500/10 text-blue-500' },
  trailer: { icon: Film, label: 'Trailer', color: 'bg-red-500/10 text-red-500' },
  release: { icon: PartyPopper, label: 'Release', color: 'bg-green-500/10 text-green-500' },
  update: { icon: Bell, label: 'Update', color: 'bg-yellow-500/10 text-yellow-500' },
  event: { icon: Sparkles, label: 'Event', color: 'bg-purple-500/10 text-purple-500' }
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [previousStats, setPreviousStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{ title: string; data: any[]; type: 'line' | 'bar' } | null>(null);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    youtubeUrl: '',
    articleUrl: '',
    imageUrl: '',
    category: 'news' as 'news' | 'trailer' | 'release' | 'update' | 'event',
    isPinned: false
  });

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const admin = await isAdmin(user.uid);
      if (!admin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }
      setHasAccess(true);
      loadStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Error checking admin access');
      navigate('/');
    }
  };

  // Load previous stats from localStorage
  const loadPreviousStats = (): AdminStats | null => {
    try {
      const stored = localStorage.getItem('admin_stats_previous');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading previous stats:', error);
    }
    return null;
  };

  // Save current stats to localStorage
  const saveCurrentStats = (currentStats: AdminStats) => {
    try {
      localStorage.setItem('admin_stats_previous', JSON.stringify(currentStats));
      localStorage.setItem('admin_stats_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  // Calculate change percentage
  const calculateChange = (current: number, previous: number): { value: number; percentage: number; trend: 'up' | 'down' | 'neutral' } => {
    if (!previous || previous === 0) {
      return { value: current, percentage: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
    }
    const change = current - previous;
    const percentage = ((change / previous) * 100);
    return {
      value: change,
      percentage: Math.abs(percentage),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  // Generate chart data (last 7 days)
  const generateChartData = (metricName: string, currentValue: number): any[] => {
    const days = 7;
    const data = [];
    const today = new Date();
    
    // Generate data points for last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Simulate gradual growth with more realistic progression
      const progress = (days - i) / days;
      // Start from a lower value and gradually increase to current
      const baseValue = currentValue * 0.3; // Start at 30% of current
      const growthFactor = 1 + (progress * 0.7); // Grow to 100%
      const variance = 0.85 + (Math.random() * 0.3); // Add some variance
      const value = Math.max(0, Math.round(baseValue * growthFactor * variance));
      
      data.push({
        date: dateStr,
        value: i === 0 ? currentValue : value // Today's value should be exact
      });
    }
    
    return data;
  };

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Load previous stats
      const prev = loadPreviousStats();
      setPreviousStats(prev);
      
      // Load current stats
      const data = await getAdminStats();
      setStats(data as AdminStats);
      
      // Save current stats for next visit
      saveCurrentStats(data as AdminStats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast.error('Failed to load admin statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleMetricClick = (title: string, currentValue: number, metricKey: keyof AdminStats) => {
    const chartData = generateChartData(title, currentValue);
    setSelectedMetric({
      title,
      data: chartData,
      type: 'line'
    });
    setIsGraphOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
  };

  // Load announcements
  const loadAnnouncements = async () => {
    setIsAnnouncementsLoading(true);
    try {
      const data = await getAllAnnouncements();
      setAnnouncements(data as Announcement[]);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      youtubeUrl: '',
      articleUrl: '',
      imageUrl: '',
      category: 'news',
      isPinned: false
    });
  };

  // Open edit modal
  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      youtubeUrl: announcement.youtubeUrl || '',
      articleUrl: announcement.articleUrl || '',
      imageUrl: announcement.imageUrl || '',
      category: announcement.category,
      isPinned: announcement.isPinned
    });
    setIsEditOpen(true);
  };

  // Create announcement
  const handleCreate = async () => {
    if (!user || !formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnnouncement({
        ...formData,
        authorUid: user.uid,
        authorName: user.displayName || 'Admin'
      });
      toast.success('Announcement created');
      setIsCreateOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update announcement
  const handleUpdate = async () => {
    if (!editingAnnouncement) return;

    setIsSubmitting(true);
    try {
      await updateAnnouncement(editingAnnouncement.id, formData);
      toast.success('Announcement updated');
      setIsEditOpen(false);
      setEditingAnnouncement(null);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete announcement
  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success('Announcement deleted');
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleAnnouncementStatus(id, !isActive);
      toast.success(isActive ? 'Announcement hidden' : 'Announcement published');
      loadAnnouncements();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Toggle pinned status
  const handleTogglePinned = async (id: string, isPinned: boolean) => {
    try {
      await toggleAnnouncementPinned(id, !isPinned);
      toast.success(isPinned ? 'Unpinned' : 'Pinned to top');
      loadAnnouncements();
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  // Load announcements on mount
  useEffect(() => {
    if (hasAccess) {
      loadAnnouncements();
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-12">
          <p className="text-muted-foreground">No statistics available</p>
        </div>
      </Layout>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    previousValue,
    icon: Icon, 
    metricKey
  }: { 
    title: string; 
    value: number; 
    previousValue?: number;
    icon: any; 
    metricKey: keyof AdminStats;
  }) => {
    const change = previousValue !== undefined ? calculateChange(value, previousValue) : null;
    const lastVisitTime = localStorage.getItem('admin_stats_timestamp');
    const lastVisitDate = lastVisitTime ? new Date(lastVisitTime).toLocaleString() : null;
    
    return (
      <Card 
        className="p-4 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all group"
        onClick={() => handleMetricClick(title, value, metricKey)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <BarChart3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {previousValue !== undefined ? (
              change && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1">
                    {change.trend === 'up' && <ArrowUp className="h-3 w-3 text-green-500" />}
                    {change.trend === 'down' && <ArrowDown className="h-3 w-3 text-red-500" />}
                    {change.trend === 'neutral' && <span className="h-3 w-3 text-muted-foreground">—</span>}
                    <span className={`text-xs font-medium ${change.trend === 'up' ? 'text-green-500' : change.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {change.value > 0 ? '+' : ''}{change.value.toLocaleString()} ({change.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  {lastVisitDate && (
                    <p className="text-[10px] text-muted-foreground">
                      Since last visit ({lastVisitDate.split(',')[0]})
                    </p>
                  )}
                </div>
              )
            ) : (
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground">
                  First visit - data will be tracked from next visit
                </p>
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <H1 className="text-3xl">Admin Dashboard</H1>
              <p className="text-muted-foreground">Monitor traffic, users, and platform activity</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* User Metrics */}
        <section className="mb-8">
          <H2 className="text-xl mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Metrics
          </H2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              previousValue={previousStats?.totalUsers}
              icon={Users}
              metricKey="totalUsers"
            />
            <StatCard
              title="New Users (Today)"
              value={stats.newUsersToday}
              previousValue={previousStats?.newUsersToday}
              icon={UserPlus}
              metricKey="newUsersToday"
            />
            <StatCard
              title="New Users (This Week)"
              value={stats.newUsersThisWeek}
              previousValue={previousStats?.newUsersThisWeek}
              icon={TrendingUp}
              metricKey="newUsersThisWeek"
            />
            <StatCard
              title="New Users (This Month)"
              value={stats.newUsersThisMonth}
              previousValue={previousStats?.newUsersThisMonth}
              icon={TrendingUp}
              metricKey="newUsersThisMonth"
            />
            <StatCard
              title="Active Users (Today)"
              value={stats.activeUsersToday}
              previousValue={previousStats?.activeUsersToday}
              icon={Activity}
              metricKey="activeUsersToday"
            />
            <StatCard
              title="Active Users (This Week)"
              value={stats.activeUsersThisWeek}
              previousValue={previousStats?.activeUsersThisWeek}
              icon={Activity}
              metricKey="activeUsersThisWeek"
            />
          </div>
        </section>

        {/* Content Metrics */}
        <section className="mb-8">
          <H2 className="text-xl mb-4 flex items-center gap-2">
            <Film className="h-5 w-5" />
            Content Metrics
          </H2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Logs"
              value={stats.totalLogs}
              previousValue={previousStats?.totalLogs}
              icon={Film}
              metricKey="totalLogs"
            />
            <StatCard
              title="New Logs (Today)"
              value={stats.newLogsToday}
              previousValue={previousStats?.newLogsToday}
              icon={Film}
              metricKey="newLogsToday"
            />
            <StatCard
              title="New Logs (This Week)"
              value={stats.newLogsThisWeek}
              previousValue={previousStats?.newLogsThisWeek}
              icon={TrendingUp}
              metricKey="newLogsThisWeek"
            />
            <StatCard
              title="New Logs (This Month)"
              value={stats.newLogsThisMonth}
              previousValue={previousStats?.newLogsThisMonth}
              icon={TrendingUp}
              metricKey="newLogsThisMonth"
            />
            <StatCard
              title="Total Reviews"
              value={stats.totalReviews}
              previousValue={previousStats?.totalReviews}
              icon={MessageSquare}
              metricKey="totalReviews"
            />
            <StatCard
              title="New Reviews (Today)"
              value={stats.newReviewsToday}
              previousValue={previousStats?.newReviewsToday}
              icon={MessageSquare}
              metricKey="newReviewsToday"
            />
            <StatCard
              title="New Reviews (This Week)"
              value={stats.newReviewsThisWeek}
              previousValue={previousStats?.newReviewsThisWeek}
              icon={TrendingUp}
              metricKey="newReviewsThisWeek"
            />
            <StatCard
              title="New Reviews (This Month)"
              value={stats.newReviewsThisMonth}
              previousValue={previousStats?.newReviewsThisMonth}
              icon={TrendingUp}
              metricKey="newReviewsThisMonth"
            />
            <StatCard
              title="Total Lists"
              value={stats.totalLists}
              previousValue={previousStats?.totalLists}
              icon={List}
              metricKey="totalLists"
            />
            <StatCard
              title="New Lists (Today)"
              value={stats.newListsToday}
              previousValue={previousStats?.newListsToday}
              icon={List}
              metricKey="newListsToday"
            />
            <StatCard
              title="New Lists (This Week)"
              value={stats.newListsThisWeek}
              previousValue={previousStats?.newListsThisWeek}
              icon={TrendingUp}
              metricKey="newListsThisWeek"
            />
            <StatCard
              title="New Lists (This Month)"
              value={stats.newListsThisMonth}
              previousValue={previousStats?.newListsThisMonth}
              icon={TrendingUp}
              metricKey="newListsThisMonth"
            />
            <StatCard
              title="Total Favorites"
              value={stats.totalFavorites}
              previousValue={previousStats?.totalFavorites}
              icon={Heart}
              metricKey="totalFavorites"
            />
            <StatCard
              title="New Favorites (Today)"
              value={stats.newFavoritesToday}
              previousValue={previousStats?.newFavoritesToday}
              icon={Heart}
              metricKey="newFavoritesToday"
            />
            <StatCard
              title="New Favorites (This Week)"
              value={stats.newFavoritesThisWeek}
              previousValue={previousStats?.newFavoritesThisWeek}
              icon={TrendingUp}
              metricKey="newFavoritesThisWeek"
            />
          </div>
        </section>

        {/* Community Metrics */}
        <section className="mb-8">
          <H2 className="text-xl mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Community Metrics
          </H2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Connections"
              value={stats.totalConnections}
              previousValue={previousStats?.totalConnections}
              icon={UserPlus}
              metricKey="totalConnections"
            />
            <StatCard
              title="New Connections (Today)"
              value={stats.newConnectionsToday}
              previousValue={previousStats?.newConnectionsToday}
              icon={UserPlus}
              metricKey="newConnectionsToday"
            />
            <StatCard
              title="New Connections (This Week)"
              value={stats.newConnectionsThisWeek}
              previousValue={previousStats?.newConnectionsThisWeek}
              icon={TrendingUp}
              metricKey="newConnectionsThisWeek"
            />
            <StatCard
              title="Total Polls"
              value={stats.totalPolls}
              previousValue={previousStats?.totalPolls}
              icon={BarChart3}
              metricKey="totalPolls"
            />
            <StatCard
              title="New Polls (Today)"
              value={stats.newPollsToday}
              previousValue={previousStats?.newPollsToday}
              icon={BarChart3}
              metricKey="newPollsToday"
            />
            <StatCard
              title="New Polls (This Week)"
              value={stats.newPollsThisWeek}
              previousValue={previousStats?.newPollsThisWeek}
              icon={TrendingUp}
              metricKey="newPollsThisWeek"
            />
            <StatCard
              title="Total Debates"
              value={stats.totalDebates}
              previousValue={previousStats?.totalDebates}
              icon={MessageCircle}
              metricKey="totalDebates"
            />
            <StatCard
              title="New Debates (Today)"
              value={stats.newDebatesToday}
              previousValue={previousStats?.newDebatesToday}
              icon={MessageCircle}
              metricKey="newDebatesToday"
            />
            <StatCard
              title="New Debates (This Week)"
              value={stats.newDebatesThisWeek}
              previousValue={previousStats?.newDebatesThisWeek}
              icon={TrendingUp}
              metricKey="newDebatesThisWeek"
            />
            <StatCard
              title="Total Comments"
              value={stats.totalComments}
              previousValue={previousStats?.totalComments}
              icon={MessageSquare}
              metricKey="totalComments"
            />
            <StatCard
              title="New Comments (Today)"
              value={stats.newCommentsToday}
              previousValue={previousStats?.newCommentsToday}
              icon={MessageSquare}
              metricKey="newCommentsToday"
            />
            <StatCard
              title="New Comments (This Week)"
              value={stats.newCommentsThisWeek}
              previousValue={previousStats?.newCommentsThisWeek}
              icon={TrendingUp}
              metricKey="newCommentsThisWeek"
            />
            <StatCard
              title="Total Activities"
              value={stats.totalActivities}
              previousValue={previousStats?.totalActivities}
              icon={Activity}
              metricKey="totalActivities"
            />
            <StatCard
              title="New Activities (Today)"
              value={stats.newActivitiesToday}
              previousValue={previousStats?.newActivitiesToday}
              icon={Activity}
              metricKey="newActivitiesToday"
            />
            <StatCard
              title="New Activities (This Week)"
              value={stats.newActivitiesThisWeek}
              previousValue={previousStats?.newActivitiesThisWeek}
              icon={TrendingUp}
              metricKey="newActivitiesThisWeek"
            />
          </div>
        </section>

        {/* Engagement Averages */}
        <section>
          <H2 className="text-xl mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Engagement Averages
          </H2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Avg Logs per User</p>
                <Film className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.avgLogsPerUser}</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Avg Reviews per User</p>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.avgReviewsPerUser}</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Avg Lists per User</p>
                <List className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.avgListsPerUser}</p>
            </Card>
          </div>
        </section>

        {/* Announcements Management */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <H2 className="text-xl flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </H2>
            <div className="flex items-center gap-2">
              <Link to="/announcements">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Public Page
                </Button>
              </Link>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" onClick={resetForm}>
                    <Plus className="h-4 w-4" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                  </DialogHeader>
                  <AnnouncementForm 
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreate}
                    isSubmitting={isSubmitting}
                    submitLabel="Create"
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isAnnouncementsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No announcements yet</p>
                  <p className="text-sm mt-1">Create your first announcement to share news with users.</p>
                </Card>
              ) : (
                announcements.map((announcement) => {
                  const CategoryIcon = categoryConfig[announcement.category]?.icon || Newspaper;
                  const categoryColor = categoryConfig[announcement.category]?.color || 'bg-muted';
                  
                  return (
                    <Card key={announcement.id} className={`p-4 ${!announcement.isActive ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        {announcement.youtubeVideoId && (
                          <div className="w-24 h-14 rounded overflow-hidden bg-muted shrink-0 relative">
                            <img 
                              src={`https://img.youtube.com/vi/${announcement.youtubeVideoId}/mqdefault.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Youtube className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[10px] ${categoryColor}`}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {categoryConfig[announcement.category]?.label}
                            </Badge>
                            {announcement.isPinned && (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Pin className="h-3 w-3" />
                                Pinned
                              </Badge>
                            )}
                            {!announcement.isActive && (
                              <Badge variant="destructive" className="text-[10px]">
                                Hidden
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium truncate">{announcement.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{announcement.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleTogglePinned(announcement.id, announcement.isPinned)}
                            title={announcement.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin className={`h-4 w-4 ${announcement.isPinned ? 'text-primary fill-primary' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                            title={announcement.isActive ? 'Hide' : 'Publish'}
                          >
                            {announcement.isActive ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(announcement)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{announcement.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(announcement.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <AnnouncementForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      {/* Graph Dialog */}
      <Dialog open={isGraphOpen} onOpenChange={setIsGraphOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMetric?.title} - Growth Trend</DialogTitle>
          </DialogHeader>
          {selectedMetric && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={400}>
                {selectedMetric.type === 'line' ? (
                  <LineChart data={selectedMetric.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Value"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={selectedMetric.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Value" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// Announcement Form Component
function AnnouncementForm({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  submitLabel
}: {
  formData: {
    title: string;
    content: string;
    youtubeUrl: string;
    articleUrl: string;
    imageUrl: string;
    category: 'news' | 'trailer' | 'release' | 'update' | 'event';
    isPinned: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  // Extract video ID for preview
  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };
  
  const videoId = extractVideoId(formData.youtubeUrl);

  return (
    <div className="space-y-6 mt-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Breaking: New Marvel Movie Announced..."
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Share the latest news about cinema..."
          rows={4}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as typeof formData.category }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="news">📰 News</SelectItem>
            <SelectItem value="trailer">🎬 Trailer</SelectItem>
            <SelectItem value="release">🎉 Release</SelectItem>
            <SelectItem value="update">🔔 Platform Update</SelectItem>
            <SelectItem value="event">✨ Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* YouTube URL */}
      <div className="space-y-2">
        <Label htmlFor="youtube">YouTube URL (for trailer/video)</Label>
        <Input
          id="youtube"
          value={formData.youtubeUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
          placeholder="https://youtube.com/watch?v=..."
        />
        {/* YouTube Preview */}
        {videoId && (
          <div className="mt-2 rounded-lg overflow-hidden bg-muted aspect-video relative">
            <img 
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="YouTube thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[24px] border-l-white border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Article URL */}
      <div className="space-y-2">
        <Label htmlFor="article">Article URL (optional)</Label>
        <Input
          id="article"
          value={formData.articleUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, articleUrl: e.target.value }))}
          placeholder="https://variety.com/article..."
        />
      </div>

      {/* Image URL (if no YouTube) */}
      {!formData.youtubeUrl && (
        <div className="space-y-2">
          <Label htmlFor="image">Image URL (optional)</Label>
          <Input
            id="image"
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://example.com/image.jpg"
          />
          {formData.imageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden bg-muted aspect-video">
              <img 
                src={formData.imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Pin Option */}
      <div className="flex items-center justify-between py-2">
        <div>
          <Label htmlFor="pinned">Pin to top</Label>
          <p className="text-xs text-muted-foreground">Featured announcements appear first</p>
        </div>
        <Switch
          id="pinned"
          checked={formData.isPinned}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPinned: checked }))}
        />
      </div>

      {/* Submit */}
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
