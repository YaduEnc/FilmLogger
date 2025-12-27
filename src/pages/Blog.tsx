import { Layout } from '@/components/layout/Layout';
import { H1, H2, Lead } from '@/components/ui/typography';
import { Divider } from '@/components/ui/divider';
import { Card } from '@/components/ui/card';
import { Calendar, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    title: 'Welcome to CineLunatic',
    date: 'December 2024',
    excerpt: 'Introducing a new way to track and share your film journey. Learn about our vision and what makes CineLunatic special.',
    slug: 'welcome-to-cinelunatic'
  },
  {
    title: 'Building Your Film Archive',
    date: 'December 2024',
    excerpt: 'Tips and best practices for logging your films, writing reviews, and organizing your personal cinema archive.',
    slug: 'building-your-film-archive'
  },
  {
    title: 'Community Features Launch',
    date: 'December 2024',
    excerpt: 'Connect with fellow cinephiles through polls, debates, and shared lists. Discover what the community is watching.',
    slug: 'community-features-launch'
  }
];

export default function Blog() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <H1 className="mb-4">Blog & Updates</H1>
        <Lead className="mb-8">
          News, updates, and thoughts on cinema.
        </Lead>

        <Divider className="my-8" />

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Card key={post.slug} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              
              <H2 className="text-2xl mb-3">{post.title}</H2>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                {post.excerpt}
              </p>
              
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                Read more
                <ArrowRight className="h-3 w-3" />
              </button>
            </Card>
          ))}
        </div>

        <Divider className="my-12" />

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Want to stay updated with the latest news and features?
          </p>
          <p className="text-sm text-muted-foreground">
            Follow us on social media or check back here regularly for updates.
          </p>
        </div>
      </div>
    </Layout>
  );
}

