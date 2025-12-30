import { Layout } from '@/components/layout/Layout';
import { H1, Lead } from '@/components/ui/typography';
import { Divider } from '@/components/ui/divider';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <H1 className="mb-4">Contact Us</H1>
        <Lead className="mb-8">
          Have questions or need support? We're here to help.
        </Lead>

        <Divider className="my-8" />

        <div className="space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Support
              </h2>
              <p className="text-muted-foreground">
                For general inquiries and technical support:
                <br />
                <span className="font-bold text-foreground">support@cinelunatic.com</span>
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Business Inquiries
              </h2>
              <p className="text-muted-foreground">
                For partnerships and legal matters:
                <br />
                <span className="font-bold text-foreground">+91 9220916445</span>
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Registered Office
            </h2>
            <div className="p-6 border bg-muted/30 rounded-none">
              <p className="text-muted-foreground leading-relaxed">
                OBC -19 Yamuna Colony
                <br />
                Dehradun, Uttarakhand
                <br />
                India
              </p>
            </div>
          </section>

          <section>
            <p className="text-xs text-muted-foreground italic">
              Our support team typically responds within 24-48 business hours.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
