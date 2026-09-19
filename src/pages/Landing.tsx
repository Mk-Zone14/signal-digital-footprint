import { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, CalendarDays, Check, Database, Eye, FileJson, GitBranch,
  Layers3, LockKeyhole, PenLine, Radio, ShieldCheck,
} from 'lucide-react';
import { getV2Analytics } from '../analytics';
import { DEMO_REFERENCE_DATE, getDemoData } from '../data/demoData';
import { formatDate, formatDuration } from '../utils/helpers';
import type { Activity as SignalActivity, V2Analytics } from '../types';
import './landing.css';

interface LandingProps {
  onExploreDemo: () => void;
  onImportData: () => void;
  onSignIn: () => void;
}

type ProductView = 'Overview' | 'Activities' | 'Patterns' | 'Topics' | 'Profile';
const ease = [0.16, 1, 0.3, 1] as const;

const sourceCards = [
  { label: 'GitHub', state: 'CONNECT SOON', icon: GitBranch },
  { label: 'Calendar', state: 'PLANNED', icon: CalendarDays },
  { label: 'Linear', state: 'PLANNED', icon: Layers3 },
  { label: 'Manual', state: 'AVAILABLE', icon: PenLine },
  { label: 'CSV + JSON', state: 'AVAILABLE', icon: FileJson },
  { label: 'Signal Capture', state: 'COMING LATER', icon: Radio },
] as const;

function SignalMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="signal-mark" aria-label="Signal">
      <span className="signal-mark__glyph" aria-hidden="true"><i /><i /><i /></span>
      {!compact && <span>SIGNAL</span>}
    </span>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return <p className="landing-kicker"><span aria-hidden="true" />{children}</p>;
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, delay, ease }}
    >{children}</motion.div>
  );
}

function CtaButton({ children, onClick, secondary = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  return <button className={secondary ? 'landing-cta landing-cta--secondary' : 'landing-cta'} onClick={onClick}><span>{children}</span><i aria-hidden="true"><ArrowRight /></i></button>;
}

function MetricStrip({ analytics }: { analytics: V2Analytics }) {
  const change = analytics.activityChange;
  const changeText = change.percentChange === null ? change.status : `${change.percentChange > 0 ? '+' : ''}${change.percentChange}%`;
  return (
    <div className="metric-strip" aria-label="Demo activity summary">
      <div><strong>{analytics.totalActivities}</strong><span>recorded activities</span></div>
      <div><strong>{analytics.activeDays}</strong><span>active days</span></div>
      <div><strong>{changeText}</strong><span>last {analytics.comparisonWindowDays} days</span></div>
    </div>
  );
}

function HeroProduct({ analytics, activities }: { analytics: V2Analytics; activities: SignalActivity[] }) {
  const reduceMotion = useReducedMotion();
  const topCategories = analytics.categoryDistribution.filter(item => item.count > 0).slice(0, 4);
  const recent = activities.slice(-3).reverse();
  return (
    <motion.div className="hero-product" initial={reduceMotion ? false : { opacity: 0, y: 54, rotateX: 7 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1.05, delay: 0.45, ease }}>
      <div className="hero-orbit hero-orbit--left" aria-hidden="true"><span><GitBranch /> GitHub</span><span><CalendarDays /> Calendar</span><span><PenLine /> Manual</span></div>
      <div className="hero-orbit hero-orbit--right" aria-hidden="true"><span>Activities</span><span>Patterns</span><span>Topics</span></div>
      <div className="product-window hero-window">
        <div className="product-window__bar"><SignalMark compact /><span>OVERVIEW / DEMO DATA</span><span className="window-status"><i /> LIVE HISTORY</span></div>
        <div className="hero-window__content">
          <div className="hero-window__headline">
            <div><p>ACTIVITY RANGE</p><strong>{analytics.dateRange.startStr?.slice(0, 7)} to {analytics.dateRange.endStr?.slice(0, 7)}</strong></div>
            <MetricStrip analytics={analytics} />
          </div>
          <div className="hero-window__grid">
            <div className="mini-chart-card">
              <div className="mini-card-heading"><span>Activity distribution</span><span>COUNT</span></div>
              <div className="distribution-bars">{topCategories.map(item => <div key={item.category}><span>{item.category.replace('-', ' ')}</span><i><b style={{ width: `${item.percentage}%` }} /></i><em>{item.count}</em></div>)}</div>
            </div>
            <div className="mini-activity-card">
              <div className="mini-card-heading"><span>Latest evidence</span><span>ACTIVITY</span></div>
              {recent.map(item => <div className="mini-activity" key={item.id}><i /><div><strong>{item.title}</strong><span>{item.category.replace('-', ' ')} · {item.date}</span></div></div>)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SourcesSection({ onImportData }: { onImportData: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="landing-section sources-section" id="sources" aria-labelledby="sources-title">
      <div className="landing-shell">
        <Reveal><h2 className="landing-display" id="sources-title">YOUR WORK<br />DOESN'T LIVE<br /><span>IN ONE PLACE.</span></h2></Reveal>
        <div className="source-scatter">
          {sourceCards.map((source, index) => {
            const Icon = source.icon;
            const card = <motion.div className={`source-card source-card--${index + 1}`} initial={reduceMotion ? false : { opacity: 0, y: 36 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.62, delay: index * 0.05, ease }}><div className="source-card__top"><Icon aria-hidden="true" /></div><div><strong>{source.label}</strong><small>{source.state}</small></div></motion.div>;
            return source.label === 'CSV + JSON' ? <button className="source-card-button" onClick={onImportData} key={source.label} aria-label="Open CSV and JSON import">{card}</button> : <div key={source.label}>{card}</div>;
          })}
        </div>
        <Reveal className="sources-caption"><p>Some sources are available now. Others are the direction of travel. Signal labels the difference.</p></Reveal>
      </div>
    </section>
  );
}

function TransformationSection({ analytics, activities }: { analytics: V2Analytics; activities: SignalActivity[] }) {
  const stageRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start start', 'end end'] });
  const cardsX = useTransform(scrollYProgress, [0, 0.35, 0.72, 1], reduceMotion ? [0, 0, 0, 0] : [-42, 0, 16, 28]);
  const streamScale = useTransform(scrollYProgress, [0, 0.42, 0.72, 1], reduceMotion ? [1, 1, 1, 1] : [0.78, 1, 1.04, 0.92]);
  const recent = activities.slice(-5).reverse();
  return (
    <section className="transformation-section" id="how-it-works" ref={stageRef} aria-labelledby="transform-title">
      <div className="transformation-sticky landing-shell">
        <div className="transformation-copy"><h2 id="transform-title"><span>CONNECT.</span><span>CAPTURE.</span><span>UNDERSTAND.</span></h2><div className="transformation-notes"><p><b>01</b>Bring in the tools where you already work.</p><p><b>02</b>Turn activity into one continuous history.</p><p><b>03</b>See what changed, what repeats, and what disappeared.</p></div></div>
        <div className="transformation-stage" aria-label="Sources becoming a Signal activity history">
          <motion.div className="stage-sources" style={{ x: cardsX }} aria-hidden="true"><span><GitBranch /> GitHub</span><span><CalendarDays /> Calendar</span><span><PenLine /> Manual</span></motion.div>
          <motion.div className="stage-stream" style={{ scale: streamScale }}>
            <div className="stage-stream__bar"><SignalMark compact /><span>NORMALIZED HISTORY</span></div>
            {recent.map((item, index) => <motion.div className="stage-event" key={item.id} initial={reduceMotion ? false : { opacity: 0, x: -18 }} whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.5 }}><span>{item.date.slice(5)}</span><strong>{item.title}</strong><small>{item.tags[0] ? `#${item.tags[0]}` : item.category}</small></motion.div>)}
            <div className="stage-insight"><span>RECENT CHANGE</span><strong>{analytics.activityChange.currentCount}</strong><p>activities in the current {analytics.comparisonWindowDays}-day window</p></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HistorySection({ activities }: { activities: SignalActivity[] }) {
  const reduceMotion = useReducedMotion();
  const visible = activities.slice(-7).reverse();
  return (
    <section className="landing-section history-section" id="product" aria-labelledby="history-title"><div className="landing-shell history-layout">
      <Reveal className="history-copy"><h2 className="landing-display" id="history-title">NOT ANOTHER<br />PRODUCTIVITY SCORE.<br /><span>A RECORD YOU CAN TRACE.</span></h2><p>Every observation in Signal connects back to a recorded activity. Open the history. Check the source. Follow the topic.</p></Reveal>
      <div className="activity-ledger" aria-label="Recent demo activities"><div className="activity-ledger__head"><span>ACTIVITY HISTORY</span><span>{visible.length} RECENT RECORDS</span></div>{visible.map((item, index) => <motion.article className="ledger-row" key={item.id} initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.55, delay: index * 0.045, ease }}><time>{formatDate(item.timestamp ?? item.date)}</time><div><strong>{item.title}</strong><span>{item.platform} · {formatDuration(item.duration ?? 0)}</span></div><div className="ledger-tags">{item.tags.slice(0, 2).map(tag => <span key={tag}>#{tag}</span>)}</div></motion.article>)}</div>
    </div></section>
  );
}

function PatternsSection({ analytics }: { analytics: V2Analytics }) {
  const maxHour = Math.max(...analytics.peakHours.map(item => item.count), 1);
  const maxDay = Math.max(...analytics.weekdayDistribution.map(item => item.count), 1);
  const gap = analytics.activityGaps.find(item => item.status === 'dormant') ?? analytics.activityGaps[analytics.activityGaps.length - 1];
  return (
    <section className="landing-section pattern-section" aria-labelledby="pattern-title"><div className="landing-shell">
      <Reveal><h2 className="landing-display landing-display--center" id="pattern-title">THE PATTERN<br />ONLY APPEARS<br /><span>AFTER THE HISTORY DOES.</span></h2></Reveal>
      <Reveal className="pattern-console"><div className="pattern-console__header"><span>PATTERNS / DEMO HISTORY</span><span>{analytics.observedTimestampCount} TIMESTAMPED RECORDS</span></div><div className="pattern-console__grid">
        <div className="hour-panel"><div className="console-label"><span>Activity by hour</span><span>00 to 23 UTC</span></div><div className="hour-bars" aria-label="Activity count by hour">{analytics.peakHours.map(hour => <i key={hour.hour} title={`${hour.hour}:00, ${hour.count} activities`} style={{ height: `${Math.max(5, (hour.count / maxHour) * 100)}%` }} />)}</div><div className="hour-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>
        <div className="weekday-panel"><div className="console-label"><span>Weekday distribution</span><span>COUNT</span></div>{analytics.weekdayDistribution.map(day => <div className="weekday-row" key={day.dayName}><span>{day.dayName.slice(0, 3)}</span><i><b style={{ width: `${(day.count / maxDay) * 100}%` }} /></i><em>{day.count}</em></div>)}</div>
        <div className="pattern-facts"><div><span>EQUAL PERIOD CHANGE</span><strong>{analytics.activityChange.absoluteChange > 0 ? '+' : ''}{analytics.activityChange.absoluteChange}</strong><small>activities vs previous {analytics.comparisonWindowDays} days</small></div><div><span>LONGEST ACTIVE-DAY STREAK</span><strong>{analytics.consistencyStats.longestActiveDayStreak}d</strong><small>observed consecutive days</small></div><div><span>TOPIC GAP</span><strong>{gap?.daysSinceLastActivity ?? 0}d</strong><small>{gap?.topic ?? 'No gap observed'}</small></div></div>
      </div></Reveal>
    </div></section>
  );
}

function TopicsSection({ analytics }: { analytics: V2Analytics }) {
  const selected = analytics.topTopics[0];
  const trend = analytics.topicTrends.find(item => item.topic.toLowerCase() === selected?.topic.toLowerCase());
  const gap = analytics.activityGaps.find(item => item.topic.toLowerCase() === selected?.topic.toLowerCase());
  const relationships = analytics.topicCooccurrence.filter(edge => edge.source.toLowerCase() === selected?.topic.toLowerCase() || edge.target.toLowerCase() === selected?.topic.toLowerCase()).slice(0, 5);
  return (
    <section className="landing-section topics-section" aria-labelledby="topics-title"><div className="landing-shell topics-layout">
      <Reveal><h2 className="landing-display" id="topics-title">SEE WHAT<br /><span>KEEPS COMING BACK.</span></h2><p className="landing-body">Topics become useful when their history, movement, and measured relationships stay visible.</p></Reveal>
      <Reveal className="topic-map"><div className="topic-map__core"><span>SELECTED TOPIC</span><strong>#{selected?.topic ?? 'React'}</strong><div><span>{selected?.count ?? 0} activities</span><span>{trend?.direction ?? 'flat'} vs previous period</span><span>last seen {gap?.daysSinceLastActivity ?? 0}d ago</span></div></div><div className="topic-map__nodes" aria-label="Topics observed on the same activity">{relationships.map((edge, index) => { const related = edge.source.toLowerCase() === selected?.topic.toLowerCase() ? edge.target : edge.source; return <div className={`topic-node topic-node--${index + 1}`} key={`${edge.source}-${edge.target}`}><i /><strong>#{related}</strong><span>{edge.count} shared activities</span></div>; })}</div><p className="topic-map__note"><Eye aria-hidden="true" /> Lines represent topics recorded together on the same activity.</p></Reveal>
    </div></section>
  );
}

function FutureSection() {
  return <section className="landing-section future-section" aria-labelledby="future-title"><div className="landing-shell future-layout"><Reveal><SectionTag>CONCEPT PREVIEW</SectionTag><h2 className="landing-display" id="future-title">ONE TOPIC.<br />EVERYWHERE<br /><span>IT SHOWED UP.</span></h2><p className="landing-body">As more sources become available, Signal can trace the same topic across the places where work happens.</p></Reveal><Reveal className="future-trace"><div className="future-trace__label"><span>FUTURE CONNECTED VIEW</span><span>ILLUSTRATIVE DATA</span></div><h3>#React</h3>{['GitHub', 'Calendar', 'Linear', 'Manual'].map((source, index) => <div className="future-source" key={source}><span>{source}</span><i><b style={{ width: `${90 - index * 17}%` }} /></i><em>illustrative</em></div>)}<div className="future-relations"><span>#TypeScript</span><span>#Next.js</span><span>#Design systems</span></div></Reveal></div></section>;
}

function CaptureSection() {
  return <section className="landing-section capture-section" aria-labelledby="capture-title"><div className="landing-shell capture-layout"><Reveal className="capture-browser"><div className="capture-browser__chrome"><i /><i /><i /><span>nextjs.org/docs/app</span></div><div className="capture-browser__page"><span>NEXT.JS DOCS</span><strong>React Server Components</strong><p>Learn how server and client components work together in the App Router.</p></div><div className="capture-sheet"><div><SignalMark /><span>COMING LATER</span></div><p>CURRENT PAGE</p><strong>React Server Components</strong><small>nextjs.org</small><p>TOPICS</p><div className="capture-tags"><span>React</span><span>Next.js</span></div><button disabled><Check /> Add to Signal</button></div></Reveal><Reveal><SectionTag>SIGNAL CAPTURE</SectionTag><h2 className="landing-display" id="capture-title">FOR THE THINGS<br /><span>YOUR TOOLS DON'T SEE.</span></h2><p className="landing-body">Signal Capture will let you save research, documentation, articles, and other opted-in browser activity directly to your history.</p><span className="coming-pill">COMING LATER</span></Reveal></div></section>;
}

function TrustSection() {
  const principles = [
    { icon: Eye, title: 'Explicit sources', copy: 'Signal only reads sources you deliberately connect or activity you choose to import.' },
    { icon: LockKeyhole, title: 'Account-scoped data', copy: 'Signed-in account records are separated by user through database row-level policies.' },
    { icon: ShieldCheck, title: 'Evidence over labels', copy: 'Signal reports observed activity. It does not manufacture a personality or universal score.' },
    { icon: Database, title: 'Clear connection state', copy: 'Available, planned, and disconnected sources remain visibly distinct.' },
  ];
  return <section className="landing-section trust-section" aria-labelledby="trust-title"><div className="landing-shell"><Reveal className="trust-heading"><h2 className="landing-display landing-display--center" id="trust-title">YOUR HISTORY.<br /><span>YOUR RULES.</span></h2><p>Activity history is personal. The product architecture treats it that way.</p></Reveal><div className="trust-grid">{principles.map((item, index) => { const Icon = item.icon; return <Reveal className="trust-item" delay={index * 0.05} key={item.title}><Icon aria-hidden="true" /><h3>{item.title}</h3><p>{item.copy}</p></Reveal>; })}</div></div></section>;
}

function PatternsMini({ analytics }: { analytics: V2Analytics }) {
  const max = Math.max(...analytics.weekdayDistribution.map(item => item.count), 1);
  return <div className="patterns-mini">{analytics.weekdayDistribution.map(item => <div key={item.dayName}><span>{item.dayName.slice(0, 3)}</span><i><b style={{ height: `${(item.count / max) * 100}%` }} /></i><em>{item.count}</em></div>)}</div>;
}

function ProductPreview({ analytics, activities, onExploreDemo }: { analytics: V2Analytics; activities: SignalActivity[]; onExploreDemo: () => void }) {
  const [view, setView] = useState<ProductView>('Overview');
  const recent = activities.slice(-4).reverse();
  const categories = analytics.categoryDistribution.filter(item => item.count).slice(0, 5);
  const questions: Record<ProductView, string> = { Overview: 'What am I doing, and what changed?', Activities: 'What exactly did I do?', Patterns: 'What patterns exist across time?', Topics: 'What do I keep returning to?', Profile: 'A concise, shareable activity record.' };
  return <section className="landing-section preview-section" aria-labelledby="preview-title"><div className="landing-shell"><Reveal className="preview-heading"><h2 className="landing-display landing-display--center" id="preview-title">DON'T TAKE<br /><span>THE STORY ON FAITH.</span></h2><p>Open the interface. Inspect the records. Follow the evidence.</p></Reveal><Reveal className="product-window product-preview"><div className="product-window__bar"><SignalMark compact /><span>SIGNAL / DEMO</span><span className="window-status"><i /> ACTUAL DEMO DATA</span></div><div className="product-preview__body"><nav aria-label="Product preview views">{(['Overview', 'Activities', 'Patterns', 'Topics', 'Profile'] as ProductView[]).map(item => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</nav><div className="preview-canvas"><div className="preview-canvas__header"><div><span>{view.toUpperCase()}</span><h3>{questions[view]}</h3></div><span>AS OF {analytics.referenceDate}</span></div>
    {view === 'Overview' && <><MetricStrip analytics={analytics} /><div className="preview-distribution">{categories.map(item => <div key={item.category}><span>{item.category.replace('-', ' ')}</span><i><b style={{ height: `${Math.min(100, item.percentage * 3)}%` }} /></i><em>{item.count}</em></div>)}</div></>}
    {view === 'Activities' && <div className="preview-activities">{recent.map(item => <div key={item.id}><time>{item.date}</time><strong>{item.title}</strong><span>{item.tags.slice(0, 2).map(tag => `#${tag}`).join('  ')}</span></div>)}</div>}
    {view === 'Patterns' && <PatternsMini analytics={analytics} />}
    {view === 'Topics' && <div className="preview-topics">{analytics.topTopics.slice(0, 8).map((item, index) => <span key={item.topic} style={{ opacity: 1 - index * 0.08 }}>#{item.topic}<b>{item.count}</b></span>)}</div>}
    {view === 'Profile' && <div className="preview-profile"><div><span>OBSERVED DATE SPAN</span><strong>{analytics.dateRange.startStr}<br />to {analytics.dateRange.endStr}</strong></div><div><span>ACTIVE CALENDAR DAYS</span><strong>{analytics.activeDays}</strong></div><div><span>UNIQUE TOPICS</span><strong>{analytics.topicIndex.length}</strong></div></div>}
  </div></div></Reveal><div className="preview-cta"><CtaButton onClick={onExploreDemo}>Explore the demo</CtaButton></div></div></section>;
}

export function Landing({ onExploreDemo, onImportData, onSignIn }: LandingProps) {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], reduceMotion ? [1, 1] : [1, 0.18]);
  const demo = useMemo(() => getDemoData(), []);
  const analytics = useMemo(() => getV2Analytics(demo.activities, { referenceDate: DEMO_REFERENCE_DATE, comparisonActivities: demo.activities, historyActivities: demo.activities }), [demo.activities]);
  return <div className="signal-landing">
    <a className="landing-skip" href="#landing-main">Skip to content</a>
    <header className="landing-nav"><a className="landing-nav__brand" href="#top" aria-label="Signal home"><SignalMark /></a><nav aria-label="Landing page navigation"><a href="#product">Product</a><a href="#sources">Sources</a><a href="#how-it-works">How it works</a></nav><div className="landing-nav__actions"><button className="nav-signin" onClick={onSignIn}>Sign in</button><button className="nav-demo" onClick={onExploreDemo}>Explore demo <ArrowRight aria-hidden="true" /></button></div></header>
    <main id="landing-main">
      <section className="hero-section" id="top" ref={heroRef} aria-labelledby="hero-title"><div className="hero-grid" aria-hidden="true" /><motion.div className="hero-aura" style={{ y: heroY, opacity: heroOpacity }} aria-hidden="true" /><div className="landing-shell hero-shell"><div className="hero-copy"><motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}><SectionTag>PERSONAL ACTIVITY INTELLIGENCE</SectionTag></motion.div><motion.h1 id="hero-title" initial={reduceMotion ? false : { opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease }}>YOUR DIGITAL WORK<br />LEAVES A <span>SIGNAL.</span></motion.h1><motion.p initial={reduceMotion ? false : { opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.2, ease }}>Signal turns activity across projects, tools, and learning into one living history, then reveals what changed and what keeps returning.</motion.p><motion.div className="hero-actions" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.3, ease }}><CtaButton onClick={onExploreDemo}>Explore demo</CtaButton><CtaButton onClick={onSignIn} secondary>Connect your tools</CtaButton></motion.div></div><HeroProduct analytics={analytics} activities={demo.activities} /></div></section>
      <SourcesSection onImportData={onImportData} /><TransformationSection analytics={analytics} activities={demo.activities} /><HistorySection activities={demo.activities} /><PatternsSection analytics={analytics} /><TopicsSection analytics={analytics} /><FutureSection /><CaptureSection /><TrustSection /><ProductPreview analytics={analytics} activities={demo.activities} onExploreDemo={onExploreDemo} />
      <section className="final-section" aria-labelledby="final-title"><div className="final-grid" aria-hidden="true" /><Reveal className="landing-shell final-inner"><h2 id="final-title">YOUR WORK<br />IS ALREADY<br />LEAVING A <span>SIGNAL.</span></h2><p>See it.</p><div className="final-actions"><CtaButton onClick={onExploreDemo}>Explore demo</CtaButton><CtaButton onClick={onSignIn} secondary>Sign in</CtaButton></div></Reveal></section>
    </main>
    <footer className="landing-footer"><SignalMark /><p>Personal activity intelligence. Evidence first.</p><div><button onClick={onExploreDemo}>Demo</button><button onClick={onImportData}>Import data</button><button onClick={onSignIn}>Sign in</button></div></footer>
  </div>;
}
