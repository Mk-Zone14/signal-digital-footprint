import { Activity, TimelineEvent, Interest, Skill, Category, DemoData, SkillHistoryPoint } from '../types';

const categories: Category[] = [
  'coding',
  'ai-ml',
  'finance',
  'filmmaking',
  'reading',
  'learning',
  'social',
  'projects',
];

const platforms = {
  coding: ['VS Code', 'GitHub', 'GitLab', 'Terminal', 'Neovim'],
  'ai-ml': ['Jupyter', 'Colab', 'Weights & Biases', 'Hugging Face', 'Kaggle'],
  finance: ['Bloomberg Terminal', 'TradingView', 'Excel', 'Python', 'Notion'],
  filmmaking: ['DaVinci Resolve', 'Premiere Pro', 'After Effects', 'Notion', 'Frame.io'],
  reading: ['Kindle', 'Obsidian', 'Goodreads', 'Audible', 'Physical'],
  learning: ['Coursera', 'edX', 'YouTube', 'Documentation', 'Papers'],
  social: ['Twitter', 'LinkedIn', 'Discord', 'Reddit', 'Mastodon'],
  projects: ['Figma', 'Linear', 'Notion', 'GitHub', 'Vercel'],
};

const tagsByCategory: Record<Category, string[]> = {
  coding: ['React', 'TypeScript', 'Rust', 'Go', 'Python', 'Docker', 'Kubernetes', 'GraphQL', 'REST', 'PostgreSQL'],
  'ai-ml': ['PyTorch', 'TensorFlow', 'LLMs', 'Computer Vision', 'NLP', 'MLOps', 'Transformers', 'Diffusion', 'RL', 'Fine-tuning'],
  finance: ['Quantitative', 'Algo Trading', 'Risk Management', 'Portfolio Theory', 'Derivatives', 'Python', 'Time Series', 'Backtesting', 'Factor Investing', 'Crypto'],
  filmmaking: ['Cinematography', 'Editing', 'Color Grading', 'VFX', 'Sound Design', 'Screenwriting', 'Directing', 'Production', 'Documentary', 'Short Film'],
  reading: ['Sci-Fi', 'Non-Fiction', 'Technical', 'Philosophy', 'Biography', 'Economics', 'History', 'Psychology', 'Systems', 'Innovation'],
  learning: ['Deep Learning', 'Systems Design', 'Distributed Systems', 'Cryptography', 'Compilers', 'OS', 'Networking', 'Algorithms', 'Math', 'Research'],
  social: ['Tech', 'AI', 'Startups', 'Investing', 'Creative', 'Learning', 'Building', 'Community', 'Networking', 'Mentoring'],
  projects: ['SaaS', 'Open Source', 'Side Project', 'Startup', 'Research', 'Creative', 'Tool', 'Library', 'Platform', 'Experiment'],
};

const activityTitles: Record<Category, string[]> = {
  coding: [
    'Refactored authentication module',
    'Built new API endpoints',
    'Optimized database queries',
    'Implemented CI/CD pipeline',
    'Code review session',
    'Debugged memory leak',
    'Wrote integration tests',
    'Migrated to TypeScript strict mode',
    'Designed system architecture',
    'Pair programming session',
  ],
  'ai-ml': [
    'Fine-tuned Llama-2 7B',
    'Trained diffusion model',
    'Implemented RAG pipeline',
    'Experimented with LoRA',
    'Built evaluation framework',
    'Processed training dataset',
    'Optimized inference latency',
    'Researched attention mechanisms',
    'Deployed model to production',
    'Analyzed model benchmarks',
  ],
  finance: [
    'Backtested momentum strategy',
    'Analyzed earnings reports',
    'Built risk model',
    'Researched crypto DeFi',
    'Updated portfolio allocation',
    'Studied options greeks',
    'Implemented factor model',
    'Reviewed macro indicators',
    'Stress tested portfolio',
    'Explored alt data sources',
  ],
  filmmaking: [
    'Shot documentary footage',
    'Edited short film rough cut',
    'Color graded scene',
    'Designed sound mix',
    'Wrote screenplay pages',
    'Storyboarded sequence',
    'Directed actors',
    'Composited VFX shots',
    'Reviewed dailies',
    'Exported final deliverable',
  ],
  reading: [
    'Read "The Innovators"',
    'Finished "Deep Learning" textbook',
    'Studied "Designing Data-Intensive Applications"',
    'Read "Principles" by Ray Dalio',
    'Completed "Atomic Habits"',
    'Read "Zero to One"',
    'Studied "Computer Systems"',
    'Read "The Lean Startup"',
    'Finished "Sapiens"',
    'Read "Thinking in Systems"',
  ],
  learning: [
    'Completed distributed systems course',
    'Studied transformer architecture',
    'Learned Rust ownership model',
    'Explored zero-knowledge proofs',
    'Studied compiler design',
    'Completed ML specialization',
    'Learned eBPF fundamentals',
    'Studied database internals',
    'Explored formal verification',
    'Completed cryptography course',
  ],
  social: [
    'Shared project update',
    'Engaged in technical discussion',
    'Mentored junior developer',
    'Attended virtual meetup',
    'Posted learning reflection',
    'Commented on research paper',
    'Shared article with thoughts',
    'Participated in code review',
    'Joined community call',
    'Responded to DM questions',
  ],
  projects: [
    'Launched MVP to beta users',
    'Designed new feature spec',
    'Refactored core architecture',
    'Wrote technical documentation',
    'Set up monitoring dashboard',
    'Implemented user analytics',
    'Designed database schema',
    'Built admin panel',
    'Optimized build pipeline',
    'Planned next sprint',
  ],
};

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateActivities(): Activity[] {
  const activities: Activity[] = [];
  const startDate = new Date('2025-03-01');
  const endDate = new Date('2025-09-07');
  let id = 1;

  const categoryWeights: Record<Category, number> = {
    coding: 0.25,
    'ai-ml': 0.20,
    finance: 0.10,
    filmmaking: 0.08,
    reading: 0.12,
    learning: 0.15,
    social: 0.05,
    projects: 0.05,
  };

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const activitiesPerDay = 3.2;

  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayActivityCount = Math.max(1, Math.round(activitiesPerDay * (isWeekend ? 0.6 : 1.0) * (0.7 + Math.random() * 0.6)));

    for (let i = 0; i < dayActivityCount; i++) {
      const rand = Math.random();
      let cumulative = 0;
      let selectedCategory: Category = 'coding';

      for (const [cat, weight] of Object.entries(categoryWeights)) {
        cumulative += weight;
        if (rand <= cumulative) {
          selectedCategory = cat as Category;
          break;
        }
      }

      const title = activityTitles[selectedCategory][Math.floor(Math.random() * activityTitles[selectedCategory].length)];
      const platform = platforms[selectedCategory][Math.floor(Math.random() * platforms[selectedCategory].length)];
      const tagCount = 1 + Math.floor(Math.random() * 3);
      const shuffledTags = [...tagsByCategory[selectedCategory]].sort(() => 0.5 - Math.random());
      const tags = shuffledTags.slice(0, tagCount);

      const baseDuration = {
        coding: 90,
        'ai-ml': 120,
        finance: 60,
        filmmaking: 150,
        reading: 45,
        learning: 75,
        social: 20,
        projects: 100,
      }[selectedCategory];

      const duration = Math.round(baseDuration * (0.5 + Math.random()) * (isWeekend ? 1.3 : 1.0));
      const impactScore = Math.round(30 + Math.random() * 70 * (duration / 120));

      activities.push({
        id: `act_${id++}`,
        date: currentDate.toISOString().split('T')[0],
        category: selectedCategory,
        title,
        duration,
        platform,
        tags,
        impactScore,
      });
    }
  }

  return activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function generateTimelineEvents(activities: Activity[]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: 'tl_1',
      date: '2025-09-01',
      title: 'Launched Nova AI Assistant',
      category: 'projects',
      description: 'Shipped v1.0 of personal AI assistant with RAG pipeline, local LLM inference, and plugin system. 2,400 lines of TypeScript/Rust.',
      impactScore: 95,
    },
    {
      id: 'tl_2',
      date: '2025-08-15',
      title: 'Won AI Builders Hackathon',
      category: 'ai-ml',
      description: 'First place among 340 teams. Built real-time code generation agent with self-correction loops. Prize: $15k + compute credits.',
      impactScore: 92,
    },
    {
      id: 'tl_3',
      date: '2025-07-22',
      title: 'Published "Attention Is All You Need" Deep Dive',
      category: 'learning',
      description: 'Technical blog post breaking down transformer architecture with interactive visualizations. 47k views, 2.3k shares.',
      impactScore: 78,
    },
    {
      id: 'tl_4',
      date: '2025-07-08',
      title: 'Short Film "Recursive" Selected for Festival',
      category: 'filmmaking',
      description: '12-min sci-fi short about AI consciousness. Official selection at Neon Futures Film Festival. Shot on RED Komodo.',
      impactScore: 85,
    },
    {
      id: 'tl_5',
      date: '2025-06-18',
      title: 'Open-Sourced Vector DB Benchmark Suite',
      category: 'projects',
      description: 'Comprehensive benchmarking tool for 12 vector databases. Featured in Pinecone & Weaviate newsletters. 1.2k stars.',
      impactScore: 82,
    },
    {
      id: 'tl_6',
      date: '2025-06-03',
      title: 'Completed "Advanced ML Systems" Certification',
      category: 'learning',
      description: 'Stanford CS329S equivalent. Covered distributed training, model serving, MLOps, and ML compiler optimization.',
      impactScore: 75,
    },
    {
      id: 'tl_7',
      date: '2025-05-20',
      title: 'Quant Research: Momentum + ML Hybrid',
      category: 'finance',
      description: 'Developed alpha model combining traditional momentum factors with transformer-based regime detection. Sharpe 2.1 backtest.',
      impactScore: 88,
    },
    {
      id: 'tl_8',
      date: '2025-05-05',
      title: 'Built Custom Mechanical Keyboard',
      category: 'projects',
      description: 'Alice layout, QMK firmware, lubed Gateron Oil Kings, custom PCB. Documented build process on YouTube (34k views).',
      impactScore: 70,
    },
    {
      id: 'tl_9',
      date: '2025-04-12',
      title: 'Speaker at Systems Engineering Meetup',
      category: 'social',
      description: 'Talk: "Building Reliable Distributed Systems at Scale". 120 attendees. Slides downloaded 800+ times.',
      impactScore: 72,
    },
    {
      id: 'tl_10',
      date: '2025-03-28',
      title: 'Started "Neural Radiance Fields" Research Project',
      category: 'ai-ml',
      description: 'Exploring NeRF optimization for real-time rendering. Collaborating with 2 researchers. Target: SIGGRAPH submission.',
      impactScore: 80,
    },
    {
      id: 'tl_11',
      date: '2025-03-15',
      title: 'Refactored Core Trading Engine',
      category: 'coding',
      description: 'Migrated legacy Python/Rust hybrid to pure Rust. 40% latency reduction, eliminated GC pauses. Zero-downtime deploy.',
      impactScore: 86,
    },
    {
      id: 'tl_12',
      date: '2025-03-01',
      title: 'Year-Start Planning: Q1-Q2 Roadmap',
      category: 'projects',
      description: 'Defined OKRs for H1 2025: Ship 3 major projects, publish 12 technical posts, speak at 2 conferences, learn Rust deeply.',
      impactScore: 65,
    },
  ];

  return events;
}

function generateInterests(activities: Activity[]): Interest[] {
  const categoryActivityCount: Record<Category, number> = {} as Record<Category, number>;
  const categoryProjectCount: Record<Category, number> = {} as Record<Category, number>;

  categories.forEach(cat => {
    categoryActivityCount[cat] = activities.filter(a => a.category === cat).length;
    categoryProjectCount[cat] = activities.filter(a => a.category === cat && a.tags.some(t => ['SaaS', 'Open Source', 'Side Project', 'Startup', 'Research', 'Tool', 'Library', 'Platform'].includes(t))).length;
  });

  const totalActivities = activities.length;

  const interestData = [
    { name: 'AI / Machine Learning', category: 'ai-ml' as Category, related: ['Deep Learning', 'LLMs', 'Computer Vision', 'MLOps', 'Research'] },
    { name: 'Software Engineering', category: 'coding' as Category, related: ['Systems Design', 'Rust', 'Distributed Systems', 'Architecture', 'Performance'] },
    { name: 'Quantitative Finance', category: 'finance' as Category, related: ['Algo Trading', 'Risk Models', 'Portfolio Theory', 'Crypto', 'Alt Data'] },
    { name: 'Filmmaking', category: 'filmmaking' as Category, related: ['Cinematography', 'Editing', 'VFX', 'Directing', 'Storytelling'] },
    { name: 'Technical Writing', category: 'learning' as Category, related: ['Blogging', 'Documentation', 'Research Papers', 'Tutorials', 'Newsletters'] },
    { name: 'Open Source', category: 'projects' as Category, related: ['Library Design', 'Community', 'Maintainership', 'Tooling', 'Standards'] },
    { name: 'Startup Building', category: 'projects' as Category, related: ['Product Strategy', 'Fundraising', 'Team Building', 'GTM', 'Metrics'] },
    { name: 'Systems Research', category: 'learning' as Category, related: ['OS', 'Networking', 'Databases', 'Compilers', 'Formal Methods'] },
    { name: 'Creative Coding', category: 'filmmaking' as Category, related: ['Generative Art', 'Shaders', 'WebGL', 'Interactive', 'Installations'] },
    { name: 'Developer Experience', category: 'coding' as Category, related: ['Tooling', 'CLI Design', 'API Design', 'Documentation', 'Onboarding'] },
  ];

  return interestData.map((item, idx) => {
    const count = categoryActivityCount[item.category] || 0;
    const projectCount = categoryProjectCount[item.category] || 0;
    const strength = Math.min(100, Math.round((count / totalActivities) * 100 * 3.5 + 15));
    const growth = Math.round(-10 + Math.random() * 50);

    return {
      id: `int_${idx + 1}`,
      name: item.name,
      category: item.category,
      strength,
      activityCount: count,
      projectCount,
      growth,
      relatedInterests: item.related,
    };
  }).sort((a, b) => b.strength - a.strength);
}

function generateSkills(activities: Activity[]): Skill[] {
  const skillDefinitions = [
    { name: 'Python', category: 'coding' as Category, baseLevel: 85, growthRate: 0.3 },
    { name: 'AI / ML Engineering', category: 'ai-ml' as Category, baseLevel: 78, growthRate: 0.5 },
    { name: 'Web Development', category: 'coding' as Category, baseLevel: 82, growthRate: 0.2 },
    { name: 'Data Analysis', category: 'finance' as Category, baseLevel: 75, growthRate: 0.25 },
    { name: 'Technical Communication', category: 'learning' as Category, baseLevel: 70, growthRate: 0.4 },
    { name: 'Creative Direction', category: 'filmmaking' as Category, baseLevel: 65, growthRate: 0.35 },
    { name: 'Rust', category: 'coding' as Category, baseLevel: 45, growthRate: 0.8 },
    { name: 'Systems Architecture', category: 'coding' as Category, baseLevel: 72, growthRate: 0.25 },
  ];

  const startDate = new Date('2025-03-01');
  const endDate = new Date('2025-09-07');

  return skillDefinitions.map((def, idx) => {
    const history: SkillHistoryPoint[] = [];
    const months = 6;

    for (let m = 0; m <= months; m++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + m);
      const progress = m / months;
      const noise = (Math.random() - 0.5) * 3;
      const level = Math.min(100, Math.max(0, Math.round(def.baseLevel * (0.6 + progress * 0.4) + def.growthRate * progress * 20 + noise)));

      history.push({
        date: date.toISOString().split('T')[0],
        level,
      });
    }

    return {
      id: `skill_${idx + 1}`,
      name: def.name,
      category: def.category,
      level: history[history.length - 1].level,
      history,
    };
  });
}

export const demoData: DemoData = (() => {
  const activities = generateActivities();
  return {
    activities,
    timelineEvents: generateTimelineEvents(activities),
    interests: generateInterests(activities),
    skills: generateSkills(activities),
  };
})();

export function getDemoData(): DemoData {
  return demoData;
}