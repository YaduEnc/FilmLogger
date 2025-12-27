import { Layout } from '@/components/layout/Layout';
import { H1, H2, Lead } from '@/components/ui/typography';
import { Divider } from '@/components/ui/divider';

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <H1 className="mb-4">Privacy Policy</H1>
        <Lead className="mb-8">
          Your privacy is important to us.
        </Lead>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <Divider className="my-8" />

        <div className="space-y-8">
          <section>
            <H2 className="mb-4">What We Collect</H2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect only the information necessary to provide you with the best experience:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Account information (email, display name, profile photo)</li>
              <li>Your film diary entries (logs, ratings, reviews)</li>
              <li>Lists and watchlists you create</li>
              <li>Social interactions (connections, messages, comments)</li>
              <li>Usage data to improve our service</li>
            </ul>
          </section>

          <section>
            <H2 className="mb-4">How We Use Your Data</H2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your data is used to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide and maintain the CineLunatic service</li>
              <li>Generate your personal statistics and insights</li>
              <li>Enable social features (if you choose to use them)</li>
              <li>Improve and optimize our platform</li>
              <li>Communicate important updates</li>
            </ul>
          </section>

          <section>
            <H2 className="mb-4">Your Privacy Rights</H2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have complete control over your data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access and download all your data</li>
              <li>Edit or delete any content you've created</li>
              <li>Control your privacy settings</li>
              <li>Delete your account at any time</li>
            </ul>
          </section>

          <section>
            <H2 className="mb-4">Data Security</H2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard security measures to protect your data. 
              Your information is stored securely using Firebase, Google's trusted 
              cloud platform. We never sell your data to third parties.
            </p>
          </section>

          <section>
            <H2 className="mb-4">Cookies</H2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. 
              We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <H2 className="mb-4">Changes to This Policy</H2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We'll notify you of 
              any significant changes via email or through the platform.
            </p>
          </section>

          <section>
            <H2 className="mb-4">Contact Us</H2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this privacy policy, please contact us 
              through our contact page.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}

