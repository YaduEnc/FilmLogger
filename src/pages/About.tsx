import { Layout } from '@/components/layout/Layout';
import { H1, H2, Lead } from '@/components/ui/typography';
import { Divider } from '@/components/ui/divider';

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <H1 className="mb-4">About CineLunatic</H1>
        <Lead className="mb-8">
          A personal archive for your cinema life.
        </Lead>

        <Divider className="my-8" />

        <div className="prose prose-neutral max-w-none">
          <H2 className="mb-4">Our Story</H2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            CineLunatic was born from a simple idea: film lovers deserve a beautiful, 
            private space to document their cinematic journey. No ads, no distractions—just 
            you and your films.
          </p>

          <H2 className="mb-4">What We Believe</H2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We believe that every film you watch is part of your story. Whether it's a 
            masterpiece that changed your perspective or a guilty pleasure that made you 
            smile, each viewing deserves to be remembered.
          </p>

          <H2 className="mb-4">Our Mission</H2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            To create the most thoughtful, elegant film diary that respects your privacy 
            and celebrates your love for cinema. We're building a community of cinephiles 
            who appreciate both the art of film and the art of reflection.
          </p>

          <H2 className="mb-4">The Team</H2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Developed by <span className="font-medium text-foreground">Yaduraj Singh</span>, 
            inspired by the vision of <span className="font-medium text-foreground">Hakla Shahrukh</span>.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Learn more about Yaduraj at{' '}
            <a 
              href="https://yaduraj.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              yaduraj.me
            </a>
          </p>

          <H2 className="mb-4">Get In Touch</H2>
          <p className="text-muted-foreground leading-relaxed">
            Have questions, suggestions, or just want to chat about films? 
            We'd love to hear from you. Reach out through our{' '}
            <a href="/contact" className="text-primary hover:underline">contact page</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}

