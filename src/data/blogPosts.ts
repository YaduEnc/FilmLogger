
export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    content: string;
    author: string;
    readTime: string;
    image?: string;
}

export const blogPosts: BlogPost[] = [
    {
        slug: 'welcome-to-cinelunatic',
        title: 'Welcome to CineLunatic',
        date: 'December 2024',
        excerpt: 'Introducing a new way to track and share your film journey. Learn about our vision and what makes CineLunatic special.',
        author: 'The Archives',
        readTime: '3 min read',
        content: `
      <p>Cinema is not just about entertainment; it's about memory, feeling, and the indelible mark that stories leave on our lives. For too long, the tools we use to track our film journeys have felt utilitarian—lists without soul, databases without emotion.</p>
      
      <p><strong>CineLunatic</strong> was born from a desire to change that.</p>

      <h2>The Vision</h2>
      <p>We wanted to build a space that feels as premium and considered as the films we love. A digital sanctuary where your watch history isn't just a number, but a curated archive of your taste and evolution as a viewer.</p>

      <p>Everything in CineLunatic, from the typography to the motion design, is crafted to honor the art of filmmaking. We believe that the interface you use to interact with art should be art itself.</p>

      <h2>What Sets Us Apart</h2>
      <ul>
        <li><strong>Aesthetic First:</strong> No more cluttered interfaces. We prioritize visual breathing room and cinematic imagery.</li>
        <li><strong>Community, curated:</strong> Connect with fellow cinephiles who care about quality discourse.</li>
        <li><strong>Deep Stats:</strong> Understand your viewing habits with beautiful, insightful visualizations.</li>
      </ul>

      <p>This is just the beginning. We have a roadmap filled with features that will bring you closer to the movies you love and the people who love them.</p>

      <p>Welcome to the archives.</p>
    `
    },
    {
        slug: 'building-your-film-archive',
        title: 'Building Your Film Archive',
        date: 'December 2024',
        excerpt: 'Tips and best practices for logging your films, writing reviews, and organizing your personal cinema archive.',
        author: 'Curatorial Team',
        readTime: '5 min read',
        content: `
      <p>An archive is more than a storage unit; it is a carefully selected collection of documents and records. When you log films on CineLunatic, you are building your personal archive—a reflection of your time, your mood, and your perspective.</p>

      <h2>The Art of Logging</h2>
      <p>Don't just tick a box. When you log a film, take a moment to record the context. Who were you with? Where did you watch it? How did it make you feel immediately after the credits rolled?</p>
      
      <p>These details turn a simple data point into a memory you can revisit years later.</p>

      <h2>Curation Strategies</h2>
      <p>Lists are your best friend. Use them not just for "Best of" rankings, but for capturing moods and themes:</p>
      
      <ul>
        <li><strong>"Rainy Sunday Afternoons":</strong> Comfort films that feel like a warm blanket.</li>
        <li><strong>"Neon Noir":</strong> Films soaked in city lights and moral ambiguity.</li>
        <li><strong>"Visual Feasts":</strong> Movies where every frame is a painting.</li>
      </ul>

      <p>Your profile is your gallery. Curate it with intention. Let it tell the story of who you are through the lens of what you watch.</p>
    `
    },
    {
        slug: 'community-features-launch',
        title: 'Community Features Launch',
        date: 'December 2024',
        excerpt: 'Connect with fellow cinephiles through polls, debates, and shared lists. Discover what the community is watching.',
        author: 'Product Team',
        readTime: '4 min read',
        content: `
      <p>Film is often a solitary experience, but the conversation that follows is communal. Today, we are excited to expand the social capabilities of CineLunatic.</p>

      <h2>Polls & Debates</h2>
      <p>Who had the better year: 1999 or 2007? Is "The Godfather Part II" superior to the original? Engage in structured, friendly debates with the community. Cast your vote and see where you stand among your peers.</p>

      <h2>Collaborative Lists</h2>
      <p>Planning a movie marathon with friends? You can now create collaborative lists. Invite friends to add their picks and vote on the final lineup.</p>

      <h2>Real-Time Connection</h2>
      <p>See what your friends are watching right now. Our new activity feed brings the theater lobby experience to your screen, allowing for spontaneous discussions and recommendations.</p>

      <p>We are building the most vibrant community of film lovers on the web, and we are thrilled to have you with us.</p>
    `
    }
];
