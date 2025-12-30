import { Layout } from '@/components/layout/Layout';
import { H1, H2, Lead } from '@/components/ui/typography';
import { Divider } from '@/components/ui/divider';

export default function Refunds() {
    return (
        <Layout>
            <div className="container mx-auto px-6 py-12 max-w-3xl">
                <H1 className="mb-4">Cancellations & Refunds</H1>
                <Lead className="mb-8">
                    Our policy regarding subscription cancellations and refund requests.
                </Lead>

                <Divider className="my-8" />

                <div className="space-y-8">
                    <section>
                        <H2 className="mb-4">1. Subscription Cancellation</H2>
                        <p className="text-muted-foreground leading-relaxed">
                            You can cancel your CineLunatic Pro or Legend subscription at any time through
                            your Account Settings. Upon cancellation, you will continue to have access
                            to premium features until the end of your current billing period.
                        </p>
                    </section>

                    <section>
                        <H2 className="mb-4">2. Refund Policy</H2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            We offer a "no questions asked" refund policy under the following conditions:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Refund requests made within <span className="font-bold text-foreground">7 days</span> of the initial purchase.</li>
                            <li>Requests made due to technical issues that we are unable to resolve.</li>
                            <li>Accidental duplicate charges.</li>
                        </ul>
                    </section>

                    <section>
                        <H2 className="mb-4">3. Non-Refundable Items</H2>
                        <p className="text-muted-foreground leading-relaxed">
                            Refunds are not typically provided for:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Subscription renewals (unless requested within 48 hours of charge).</li>
                            <li>Accounts that have been terminated for violating our Terms of Service.</li>
                            <li>Partial months of service after the initial 7-day period.</li>
                        </ul>
                    </section>

                    <section>
                        <H2 className="mb-4">4. How to Request a Refund</H2>
                        <p className="text-muted-foreground leading-relaxed">
                            To request a refund, please contact us at <span className="font-bold text-foreground">support@cinelunatic.com</span> with
                            your account email and transaction ID. Refunds are processed back to the
                            original payment method within 5-10 business hours.
                        </p>
                    </section>

                    <section>
                        <p className="text-sm text-muted-foreground">
                            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
