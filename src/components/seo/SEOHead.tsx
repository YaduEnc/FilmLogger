import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title: string;
    description: string;
    image?: string;
    type?: 'website' | 'article' | 'profile';
    canonicalUrl?: string;
    structuredData?: Record<string, any>;
    children?: React.ReactNode;
}

export function SEOHead({
    title,
    description,
    image = '/og-image.png',
    type = 'website',
    canonicalUrl,
    structuredData,
    children
}: SEOHeadProps) {
    const siteUrl = 'https://cine.yaduraj.me/'; // Replace with actual domain
    const fullUrl = canonicalUrl ? canonicalUrl : typeof window !== 'undefined' ? window.location.href : siteUrl;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}

            {children}
        </Helmet>
    );
}
