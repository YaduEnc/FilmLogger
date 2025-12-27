import { Layout } from '@/components/layout/Layout';
import { H1, H2, Lead } from '@/components/ui/typography';
import { Divider } from '@/components/ui/divider';

export default function Terms() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <H1 className="mb-4">Terms of Service</H1>
        <Lead className="mb-8">
          Please read these terms carefully before using CineLunatic.
        </Lead>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <Divider className="my-8" />

        <div className="space-y-8">
          <section>
            <H2 className="mb-4">1. Acceptance of Terms</H2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using CineLunatic, you accept and agree to be bound by 
              these Terms of Service. If you do not agree to these terms, please do not 
              use our service.
            </p>
          </section>

          <section>
            <H2 className="mb-4">2. Description of Service</H2>
            <p className="text-muted-foreground leading-relaxed">
              CineLunatic is a personal film diary and social platform for cinema lovers. 
              We provide tools to log, review, and track your film watching experience, 
              as well as connect with other film enthusiasts.
            </p>
          </section>

          <section>
            <H2 className="mb-4">3. User Accounts</H2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use CineLunatic, you must:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Be at least 13 years old</li>
              <li>Provide accurate account information</li>
              <li>Maintain the security of your account</li>
              <li>Not share your account with others</li>
              <li>Notify us of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <H2 className="mb-4">4. User Content</H2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You retain ownership of all content you create on CineLunatic. By posting 
              content, you grant us a license to display and distribute it through our 
              platform. You agree that your content:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Does not violate any laws or regulations</li>
              <li>Does not infringe on others' intellectual property</li>
              <li>Does not contain hate speech or harassment</li>
              <li>Does not contain spam or malicious content</li>
            </ul>
          </section>

          <section>
            <H2 className="mb-4">5. Prohibited Activities</H2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may not:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Use the service for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Scrape or collect data without permission</li>
              <li>Impersonate others or create fake accounts</li>
              <li>Distribute viruses or malicious code</li>
            </ul>
          </section>

          <section>
            <H2 className="mb-4">6. Intellectual Property</H2>
            <p className="text-muted-foreground leading-relaxed">
              The CineLunatic platform, including its design, features, and functionality, 
              is owned by us and protected by copyright and other intellectual property laws. 
              Movie data is provided by The Movie Database (TMDB) API.
            </p>
          </section>

          <section>
            <H2 className="mb-4">7. Termination</H2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate 
              these terms. You may also delete your account at any time through your 
              settings.
            </p>
          </section>

          <section>
            <H2 className="mb-4">8. Disclaimer</H2>
            <p className="text-muted-foreground leading-relaxed">
              CineLunatic is provided "as is" without warranties of any kind. We do not 
              guarantee that the service will be uninterrupted or error-free. We are not 
              responsible for any content posted by users.
            </p>
          </section>

          <section>
            <H2 className="mb-4">9. Limitation of Liability</H2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, CineLunatic shall not be liable 
              for any indirect, incidental, special, or consequential damages arising 
              from your use of the service.
            </p>
          </section>

          <section>
            <H2 className="mb-4">10. Changes to Terms</H2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. We will notify you of any 
              material changes. Your continued use of the service after changes 
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <H2 className="mb-4">11. Contact</H2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these terms, please contact us through our 
              contact page.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}

