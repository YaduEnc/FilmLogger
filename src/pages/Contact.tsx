import { Layout } from '@/components/layout/Layout';
import { H1, H2, Lead } from '@/components/ui/typography';
import { Divider } from '@/components/ui/divider';
import { Card } from '@/components/ui/card';
import { Mail, MessageSquare, Github, Instagram, Film } from 'lucide-react';

export default function Contact() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <H1 className="mb-4">Get In Touch</H1>
        <Lead className="mb-8">
          We'd love to hear from you.
        </Lead>

        <Divider className="my-8" />

        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Have questions, suggestions, or just want to chat about films? 
            Feel free to reach out through any of the following channels:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <H2 className="text-base mb-2">Email</H2>
                  <p className="text-sm text-muted-foreground mb-2">
                    For general inquiries and support
                  </p>
                  <a 
                    href="mailto:yadurajsingham@gmail.com" 
                    className="text-sm text-primary hover:underline"
                  >
                    yadurajsingham@gmail.com
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Github className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <H2 className="text-base mb-2">GitHub</H2>
                  <p className="text-sm text-muted-foreground mb-2">
                    Check out the code & contribute
                  </p>
                  <a 
                    href="https://github.com/YadurajManu" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    github.com/YadurajManu
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Instagram className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <H2 className="text-base mb-2">Instagram</H2>
                  <p className="text-sm text-muted-foreground mb-2">
                    Follow for updates & behind the scenes
                  </p>
                  <a 
                    href="https://instagram.com/yduraj.doc" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    @yduraj.doc
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Film className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <H2 className="text-base mb-2">Letterboxd</H2>
                  <p className="text-sm text-muted-foreground mb-2">
                    See what I'm watching
                  </p>
                  <a 
                    href="https://letterboxd.com/Yaduraj/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    letterboxd.com/Yaduraj
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <Divider className="my-8" />

          <div>
            <H2 className="mb-4">About the Team</H2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              CineLunatic is developed by <span className="font-medium text-foreground">Yaduraj Singh</span>, 
              inspired by the vision of <span className="font-medium text-foreground">Hakla Shahrukh</span>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We're passionate about cinema and building tools that help film lovers 
              document and share their cinematic journey. Your feedback helps us make 
              CineLunatic better every day.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

