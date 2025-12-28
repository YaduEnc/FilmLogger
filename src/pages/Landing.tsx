import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { H1, Lead, H3 } from "@/components/ui/typography";
import { Divider } from "@/components/ui/divider";
import { Film, BookOpen, BarChart3, List, ArrowRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const features = [
  {
    icon: BookOpen,
    title: "Personal diary",
    description: "Log every film you watch with ratings, reviews, and personal notes.",
  },
  {
    icon: List,
    title: "Curated lists",
    description: "Create themed collections and a watchlist that actually gets watched.",
  },
  {
    icon: BarChart3,
    title: "Your stats",
    description: "See your viewing habits, favorite directors, and yearly trends.",
  },
];

const mockMovies = [
  { title: "Persona", year: 1966, director: "Ingmar Bergman" },
  { title: "In the Mood for Love", year: 2000, director: "Wong Kar-wai" },
  { title: "Stalker", year: 1979, director: "Andrei Tarkovsky" },
  { title: "Paris, Texas", year: 1984, director: "Wim Wenders" },
];

export default function Landing() {
  return (
    <Layout>
      {/* Hero */}
      <section className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-muted-foreground mb-6">
            <Logo className="h-6 w-6 text-foreground/80" />
            <span className="text-sm uppercase tracking-wider">CineLunatic / The Archive</span>
          </div>
          <H1 className="mb-6">
            A quiet place to keep your films.
          </H1>
          <Lead className="mb-8 max-w-xl">
            Log what you watch. Write about what moves you. Build a personal archive of your cinema life.
          </Lead>
          <div className="flex items-center gap-3">
            <Link to="/home">
              <Button size="lg" className="gap-2">
                Start exploring
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="ghost" size="lg">
                Search films
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Divider className="container mx-auto" />

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature) => (
            <div key={feature.title}>
              <feature.icon className="h-5 w-5 mb-4 text-muted-foreground" />
              <H3 className="mb-2">{feature.title}</H3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider className="container mx-auto" />

      {/* Preview */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Sample diary
            </p>
            <H3 className="mb-6">Your film journal</H3>
            <div className="space-y-0">
              {mockMovies.map((movie) => (
                <div
                  key={movie.title}
                  className="py-4 border-b border-border flex items-baseline justify-between"
                >
                  <div>
                    <span className="font-medium">{movie.title}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{movie.year}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{movie.director}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted/50 rounded-sm p-8 border border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">
              From a diary entry
            </p>
            <blockquote className="font-serif text-lg leading-relaxed italic">
              "The silence in Bergman's frames speaks louder than dialogue. Persona left me wondering where one identity ends and another begins."
            </blockquote>
            <div className="mt-4 text-sm text-muted-foreground">
              December 2024
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <H3 className="mb-4">Ready to start logging?</H3>
        <p className="text-muted-foreground mb-6">
          Free to use. No ads. Just you and your films.
        </p>
        <Link to="/home">
          <Button size="lg">Start exploring</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
            <Logo className="h-6 w-6" />
            <span className="font-serif text-sm">CineLunatic</span>
          </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
            A quiet corner for film lovers.
          </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-foreground transition-colors">
                    Blog/Updates
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Credits */}
            <div>
              <h4 className="text-sm font-medium mb-4">Credits</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Developed by{' '}
                  <span className="text-foreground font-medium">Yaduraj Singh</span>
                </p>
                <p>
                  Inspired by{' '}
                  <span className="text-foreground font-medium">Hakla Shahrukh</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} CineLunatic. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Made with ❤️ for cinema lovers
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
