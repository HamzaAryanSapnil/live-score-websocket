# পারফরম্যান্স অপটিমাইজেশন — সম্পূর্ণ নোট

> Node.js, Express, PostgreSQL, MongoDB — একজন সিনিয়র ইঞ্জিনিয়ারের চোখ দিয়ে লেখা।

---

## ভূমিকা — গল্পটা শুরু হয় এভাবে

তুমি একটা দোকান খুললে। শুরুতে ১০ জন customer আসে — সব ঠিকঠাক।
তারপর ১০০ জন আসলো — একটু ধীর হলো।
তারপর ১০,০০০ জন আসলো — দোকান বন্ধ হয়ে গেলো।

এটাই performance সমস্যা। আর এই সমস্যা সমাধানের নামই **Performance Optimization**।

Performance optimization মানে শুধু "দ্রুত করা" না —
মানে হলো **সঠিক জায়গায়, সঠিক সময়ে, সঠিক পরিমাণ কাজ করা।**

---

## Performance Optimization এর পাইপলাইন

যেকোনো performance সমস্যা সমাধানের একটাই সঠিক পথ আছে:

```
১. Measure (পরিমাপ করো)
      ↓
২. Identify Bottleneck (সমস্যা খুঁজে বের করো)
      ↓
৩. Fix (ঠিক করো)
      ↓
৪. Measure Again (আবার পরিমাপ করো)
      ↓
৫. Repeat (পুনরাবৃত্তি করো)
```

**সবচেয়ে বড় ভুল** — না মেপে optimize করা। এটাকে বলে "Premature Optimization"।
Donald Knuth বলেছেন: _"Premature optimization is the root of all evil."_

---

# অংশ ১ — Backend Performance Optimization

## Node.js এর মূল বিষয় — Event Loop

Node.js এর শক্তি হলো **Event Loop** — এটা single thread এ হাজার হাজার request handle করতে পারে।
কিন্তু এই Event Loop কে block করলেই সব শেষ।

```
Event Loop blocked হলে:
- সব request queue তে আটকে যায়
- Response time বাড়তে থাকে
- Server "hang" করে
```

### Event Loop block করার কারণ:

```javascript
// ❌ খারাপ — synchronous heavy computation
app.get("/calculate", (req, res) => {
  let result = 0;
  for (let i = 0; i < 1_000_000_000; i++) {
    // 1 billion loop!
    result += i; // এই সময় অন্য কোনো request serve হবে না
  }
  res.json({ result });
});

// ✅ ভালো — Worker Thread এ পাঠাও
const { Worker } = require("worker_threads");
app.get("/calculate", (req, res) => {
  const worker = new Worker("./heavy-calculation.js");
  worker.on("message", (result) => res.json({ result }));
});
```

---

## Node.js / Express Performance Techniques

### ১. Compression (Response সাইজ কমানো)

```javascript
import compression from "compression";

app.use(compression()); // Gzip compression — response size ~60% কমে
```

### ২. Connection Pooling (Database Connection পুনর্ব্যবহার)

```javascript
// ❌ খারাপ — প্রতি request এ নতুন connection
app.get("/matches", async (req, res) => {
  const client = new pg.Client(); // নতুন connection তৈরি — ধীর!
  await client.connect();
  // ...
});

// ✅ ভালো — Pool থেকে connection নাও
import { Pool } from "pg";
const pool = new Pool({ max: 20 }); // সর্বোচ্চ ২০টা connection রেডি থাকবে

app.get("/matches", async (req, res) => {
  const client = await pool.connect(); // Pool থেকে নাও — দ্রুত!
  // ...
  client.release(); // ফিরিয়ে দাও
});
```

### ৩. Caching (একই কাজ বারবার না করা)

```javascript
// In-memory cache (ছোট project এর জন্য)
const cache = new Map();

app.get("/matches", async (req, res) => {
  const cacheKey = "all_matches";

  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey)); // Cache থেকে — DB hit নেই!
  }

  const data = await db.select().from(matches);
  cache.set(cacheKey, data);

  // ৫ মিনিট পর cache clear করো
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

  res.json(data);
});
```

**Production এ Redis ব্যবহার করো:**

```javascript
import Redis from "ioredis";
const redis = new Redis();

app.get("/matches/:id", async (req, res) => {
  const cached = await redis.get(`match:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));

  const match = await db
    .select()
    .from(matches)
    .where(eq(matches.id, req.params.id));
  await redis.setex(`match:${req.params.id}`, 300, JSON.stringify(match)); // 5 min TTL
  res.json(match);
});
```

### ৪. Pagination (একবারে সব data না দেওয়া)

```javascript
// ❌ খারাপ — সব data একসাথে
const allMatches = await db.select().from(matches); // ১০ লাখ row!

// ✅ ভালো — Page করে দাও
app.get("/matches", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const data = await db
    .select()
    .from(matches)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(matches.createdAt));

  res.json({ data, page, limit });
});
```

### ৫. Async/Await সঠিকভাবে ব্যবহার

```javascript
// ❌ খারাপ — sequential (একটার পর একটা)
const user = await getUser(id); // 100ms
const matches = await getMatches(id); // 100ms
const stats = await getStats(id); // 100ms
// মোট: 300ms

// ✅ ভালো — parallel (একসাথে)
const [user, matches, stats] = await Promise.all([
  getUser(id),
  getMatches(id),
  getStats(id),
]);
// মোট: ~100ms (সবচেয়ে ধীরটার সমান)
```

### ৬. Middleware Optimization

```javascript
// ❌ খারাপ — সব route এ সব middleware
app.use(heavyAuthMiddleware);
app.use(loggingMiddleware);
app.use(rateLimiter);

// ✅ ভালো — শুধু দরকারি route এ
app.get("/public", publicHandler); // auth লাগে না
app.get("/private", heavyAuthMiddleware, privateHandler); // শুধু এখানে auth
app.get("/admin", heavyAuthMiddleware, adminOnlyMiddleware, adminHandler);
```

---

## PostgreSQL Performance Optimization

### ১. Indexing — সবচেয়ে গুরুত্বপূর্ণ

Index হলো বইয়ের সূচিপত্রের মতো। Index ছাড়া database প্রতিটা row দেখে।
Index দিয়ে সরাসরি সঠিক row তে যায়।

```sql
-- Index ছাড়া: 1,000,000 row scan করে (Seq Scan)
SELECT * FROM matches WHERE status = 'live';

-- Index তৈরি করো
CREATE INDEX idx_matches_status ON matches(status);

-- এখন: সরাসরি 'live' matches এ যায় (Index Scan) — ১০০০x দ্রুত হতে পারে!
```

**Drizzle ORM এ:**

```javascript
// src/db/schema.js
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey(),
    status: matchStatusEnum("status").notNull(),
    startTime: timestamp("start_time").notNull(),
    homeTeam: varchar("home_team").notNull(),
  },
  (table) => ({
    statusIdx: index("idx_matches_status").on(table.status),
    startTimeIdx: index("idx_matches_start_time").on(table.startTime),
    // Compound index — status + startTime দিয়ে filter করলে
    statusStartTimeIdx: index("idx_matches_status_start").on(
      table.status,
      table.startTime,
    ),
  }),
);
```

**কখন Index দেবে:**

- WHERE clause এ বারবার ব্যবহৃত column
- JOIN এ ব্যবহৃত column (foreign key)
- ORDER BY তে ব্যবহৃত column
- ১ লাখ+ row এর table

**কখন Index দেবে না:**

- ছোট table (< ১০,০০০ row)
- বারবার INSERT/UPDATE হয় এমন column (index write কে ধীর করে)
- কম unique value এর column (যেমন boolean)

### ২. EXPLAIN ANALYZE — Query কতটা ধীর বোঝো

```sql
EXPLAIN ANALYZE SELECT * FROM matches WHERE status = 'live';

-- Output দেখো:
-- Seq Scan → Index নেই, সব row scan হচ্ছে (খারাপ)
-- Index Scan → Index ব্যবহার হচ্ছে (ভালো)
-- cost=0.00..8.27 → প্রথম সংখ্যা startup cost, দ্বিতীয় total cost
-- actual time=0.123..0.456 → বাস্তব সময় (milliseconds)
```

### ৩. N+1 Query সমস্যা

```javascript
// ❌ খারাপ — N+1 Query (সবচেয়ে common performance killer)
const matches = await db.select().from(matches); // 1 query

for (const match of matches) {
  const commentary = await db
    .select()
    .from(commentary)
    .where(eq(commentary.matchId, match.id)); // N queries!
}
// ১০০টা match থাকলে = ১০১টা query!

// ✅ ভালো — JOIN দিয়ে একটা query
const matchesWithCommentary = await db
  .select()
  .from(matches)
  .leftJoin(commentary, eq(commentary.matchId, matches.id));
// মাত্র ১টা query!
```

### ৪. SELECT \* এড়িয়ে চলো

```javascript
// ❌ খারাপ — সব column নিচ্ছো
const matches = await db.select().from(matches);

// ✅ ভালো — শুধু দরকারি column
const matches = await db
  .select({
    id: matches.id,
    homeTeam: matches.homeTeam,
    awayTeam: matches.awayTeam,
    status: matches.status,
  })
  .from(matches);
// Network এ কম data যাবে, দ্রুত হবে
```

---

## MongoDB Performance Optimization

### ১. Indexing (PostgreSQL এর মতোই গুরুত্বপূর্ণ)

```javascript
// Schema তে index define করো
const matchSchema = new Schema({
  status: { type: String, index: true },
  startTime: { type: Date, index: true },
  homeTeam: String,
  awayTeam: String,
});

// Compound index
matchSchema.index({ status: 1, startTime: -1 });

// Text search index
matchSchema.index({ homeTeam: "text", awayTeam: "text" });
```

### ২. Projection (দরকারি field ই নাও)

```javascript
// ❌ খারাপ
const matches = await Match.find({ status: "live" });

// ✅ ভালো
const matches = await Match.find(
  { status: "live" },
  { homeTeam: 1, awayTeam: 1, score: 1 }, // শুধু এই field গুলো
);
```

### ৩. Aggregation Pipeline (DB তেই কাজ করাও)

```javascript
// ❌ খারাপ — সব data এনে JavaScript এ process
const allMatches = await Match.find({});
const liveCount = allMatches.filter((m) => m.status === "live").length;

// ✅ ভালো — DB তেই count করো
const stats = await Match.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } },
]);
```

### ৪. explain() দিয়ে Query Analyze করো

```javascript
const result = await Match.find({ status: "live" }).explain("executionStats");
console.log(result.executionStats);
// totalDocsExamined: 10000 → Index নেই (খারাপ)
// totalDocsExamined: 5 → Index আছে (ভালো)
```

---

---

# অংশ ২ — Frontend Performance Optimization

## Browser কীভাবে Page Render করে (Critical Rendering Path)

```
HTML Download
    ↓
DOM Tree তৈরি
    ↓
CSS Download → CSSOM Tree তৈরি
    ↓
DOM + CSSOM = Render Tree
    ↓
Layout (কোথায় কী থাকবে)
    ↓
Paint (রং করা)
    ↓
Composite (Layer merge)
    ↓
Screen এ দেখা যায়!
```

এই পথ যত দ্রুত হবে, page তত দ্রুত দেখা যাবে।

---

## Core Web Vitals (2025) — Google এর মানদণ্ড

Google এই তিনটি metric দিয়ে page এর performance মাপে:

| Metric | পুরো নাম                  | মানে                                  | ভালো মান      |
| ------ | ------------------------- | ------------------------------------- | ------------- |
| LCP    | Largest Contentful Paint  | সবচেয়ে বড় element কতক্ষণে দেখা যায় | < 2.5 সেকেন্ড |
| INP    | Interaction to Next Paint | Click/tap এর পর কতক্ষণে response আসে  | < 200ms       |
| CLS    | Cumulative Layout Shift   | Page কতটা নড়াচড়া করে                | < 0.1         |

> **Note**: Google 2024 সালে FID (First Input Delay) বাদ দিয়ে INP যোগ করেছে।

---

## Frontend Performance Techniques

### ১. Image Optimization (সবচেয়ে বড় impact)

```html
<!-- ❌ খারাপ -->
<img src="hero.png" />

<!-- ✅ ভালো — Modern format + Lazy loading + Responsive -->
<img
  src="hero.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  loading="lazy"
  alt="Hero image"
  width="1200"
  height="600"
/>
```

**Format comparison:**

- PNG/JPG → পুরনো, বড় সাইজ
- WebP → ৩০% ছোট PNG/JPG এর চেয়ে
- AVIF → ৫০% ছোট (2025 এ সব browser support করে)

### ২. JavaScript Optimization

```html
<!-- ❌ খারাপ — Render blocking -->
<script src="app.js"></script>

<!-- ✅ ভালো — defer: HTML parse হওয়ার পর execute -->
<script src="app.js" defer></script>

<!-- ✅ ভালো — async: download হলেই execute (order গুরুত্বপূর্ণ না হলে) -->
<script src="analytics.js" async></script>
```

**Code Splitting (React উদাহরণ):**

```javascript
// ❌ খারাপ — সব একসাথে load
import HeavyDashboard from "./HeavyDashboard";

// ✅ ভালো — দরকার হলে load
const HeavyDashboard = React.lazy(() => import("./HeavyDashboard"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyDashboard />
    </Suspense>
  );
}
```

### ৩. CSS Optimization

```html
<!-- Critical CSS inline করো (above-the-fold এর জন্য) -->
<style>
  /* শুধু প্রথম screen এ দেখা যায় এমন CSS */
  body {
    margin: 0;
    font-family: sans-serif;
  }
  .hero {
    height: 100vh;
    background: #000;
  }
</style>

<!-- বাকি CSS defer করো -->
<link
  rel="preload"
  href="styles.css"
  as="style"
  onload="this.rel='stylesheet'"
/>
```

### ৪. Caching (Browser Cache)

```javascript
// Express এ static file caching
app.use(
  express.static("public", {
    maxAge: "1y", // ১ বছর cache
    etag: true, // ETag দিয়ে validation
  }),
);

// API response caching
app.get("/matches", (req, res) => {
  res.set("Cache-Control", "public, max-age=60"); // ৬০ সেকেন্ড cache
  res.json(data);
});
```

### ৫. Debounce এবং Throttle

```javascript
// ❌ খারাপ — প্রতি keystroke এ API call
searchInput.addEventListener("input", (e) => {
  fetchResults(e.target.value); // ১০০ keystroke = ১০০ API call!
});

// ✅ ভালো — Debounce: শেষ input এর ৩০০ms পর call
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

searchInput.addEventListener(
  "input",
  debounce((e) => {
    fetchResults(e.target.value); // ১০০ keystroke = মাত্র ১-২ API call
  }, 300),
);

// Throttle: প্রতি ১ সেকেন্ডে সর্বোচ্চ ১ বার
function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

window.addEventListener("scroll", throttle(updateScrollPosition, 1000));
```

### ৬. Virtual DOM / List Virtualization

```javascript
// ❌ খারাপ — ১০,০০০ item render করো
{
  matches.map((match) => <MatchCard key={match.id} match={match} />);
}
// DOM এ ১০,০০০ element — ব্রাউজার কাঁদছে!

// ✅ ভালো — শুধু দেখা যাচ্ছে এমন item render করো
import { FixedSizeList } from "react-window";

<FixedSizeList height={600} itemCount={10000} itemSize={80}>
  {({ index, style }) => (
    <div style={style}>
      <MatchCard match={matches[index]} />
    </div>
  )}
</FixedSizeList>;
// DOM এ মাত্র ~১০টা element!
```

---

# অংশ ৩ — Performance Issue খুঁজে বের করা

## Backend Profiling Tools

### ১. Node.js Built-in Profiler

```bash
# Profile চালু করে server start করো
node --prof src/index.js

# কিছু request করো, তারপর বন্ধ করো
# isolate-*.log file তৈরি হবে

# Human readable করো
node --prof-process isolate-*.log > profile.txt
```

### ২. clinic.js (সবচেয়ে সহজ)

```bash
npm install -g clinic

# Doctor — সব সমস্যা diagnose করে
clinic doctor -- node src/index.js

# Flame — কোন function সবচেয়ে বেশি CPU নিচ্ছে
clinic flame -- node src/index.js

# Bubbleprof — async bottleneck খোঁজে
clinic bubbleprof -- node src/index.js
```

### ৩. Response Time Logging

```javascript
// Express middleware দিয়ে slow request ধরো
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      // ১ সেকেন্ডের বেশি হলে warn
      console.warn(`SLOW REQUEST: ${req.method} ${req.url} — ${duration}ms`);
    }
  });

  next();
});
```

### ৪. PostgreSQL Slow Query Log

```sql
-- postgresql.conf এ যোগ করো
log_min_duration_statement = 1000  -- ১ সেকেন্ডের বেশি query log করো
log_statement = 'all'              -- সব query log করো (development এ)

-- Slow query দেখো
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### ৫. MongoDB Profiler

```javascript
// Slow query profiling চালু করো
await db.command({ profile: 1, slowms: 100 }); // ১০০ms এর বেশি query log

// Slow query দেখো
const slowQueries = await db
  .collection("system.profile")
  .find({})
  .sort({ millis: -1 })
  .limit(10)
  .toArray();
```

---

## Frontend Performance Tools

### ১. Chrome DevTools

```
F12 → Performance tab → Record → করো কাজ → Stop
```

দেখবে:

- **Flame Chart**: কোন function কতক্ষণ নিচ্ছে
- **Long Tasks**: ৫০ms এর বেশি যেকোনো task (লাল রঙে)
- **Network**: কোন request ধীর

### ২. Lighthouse (সবচেয়ে সহজ)

```
Chrome DevTools → Lighthouse tab → Analyze page load
```

Score দেবে ০-১০০:

- Performance
- Accessibility
- Best Practices
- SEO

### ৩. WebPageTest

[webpagetest.org](https://webpagetest.org) — বিভিন্ন দেশ থেকে test করো।

---

# অংশ ৪ — Performance Issue Fix করার Approach

## Step-by-Step পদ্ধতি

```
Step 1: Symptom চিহ্নিত করো
  → "API response ধীর" / "Page load ধীর" / "Memory বাড়ছে"

Step 2: Measure করো
  → Lighthouse / clinic.js / EXPLAIN ANALYZE

Step 3: Bottleneck খুঁজো
  → Database? Network? CPU? Memory?

Step 4: Fix করো (একটা একটা করে)
  → Index যোগ করো / Cache বসাও / Query ঠিক করো

Step 5: আবার Measure করো
  → Fix কাজ করেছে কিনা verify করো

Step 6: Document করো
  → কী সমস্যা ছিল, কীভাবে ঠিক হলো
```

## Common Performance Issues এবং Fix

| সমস্যা                | কারণ          | Fix                       |
| --------------------- | ------------- | ------------------------- |
| Slow API response     | N+1 Query     | JOIN ব্যবহার করো          |
| Slow API response     | Index নেই     | Index যোগ করো             |
| High memory usage     | Memory leak   | Heap snapshot নাও         |
| Slow page load        | বড় JS bundle | Code splitting করো        |
| Slow page load        | বড় image     | WebP + lazy load          |
| High CPU              | Blocking code | Worker thread ব্যবহার করো |
| Repeated slow queries | Cache নেই     | Redis cache বসাও          |

---

# অংশ ৫ — Testing Performance

## Load Testing — k6 (সবচেয়ে ভালো tool)

```javascript
// load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // ৩০ সেকেন্ডে ১০ user
    { duration: "1m", target: 100 }, // ১ মিনিটে ১০০ user
    { duration: "30s", target: 0 }, // ধীরে ধীরে কমাও
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // ৯৫% request ৫০০ms এর মধ্যে
    http_req_failed: ["rate<0.01"], // ১% এর কম failure
  },
};

export default function () {
  const res = http.get("http://localhost:8000/matches");

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

```bash
# Run করো
k6 run load-test.js
```

## Artillery (Node.js এর জন্য সহজ)

```yaml
# artillery-config.yml
config:
  target: "http://localhost:8000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"

scenarios:
  - name: "Get matches"
    requests:
      - get:
          url: "/matches"
```

```bash
npm install -g artillery
artillery run artillery-config.yml
```

---

# সারসংক্ষেপ — Priority অনুযায়ী

## Backend (সবচেয়ে আগে করো):

1. **Database Index** — সবচেয়ে বেশি impact
2. **N+1 Query fix** — সবচেয়ে common সমস্যা
3. **Caching (Redis)** — repeated query কমাও
4. **Connection Pooling** — DB connection optimize করো
5. **Pagination** — বড় data set handle করো

## Frontend (সবচেয়ে আগে করো):

1. **Image optimization** — সবচেয়ে বেশি page weight
2. **JS defer/async** — render blocking কমাও
3. **Code splitting** — bundle size কমাও
4. **Caching headers** — repeated download কমাও
5. **Debounce/Throttle** — unnecessary API call কমাও

---

# ভিডিও রিসোর্স — দেখে শেখো

## Backend Performance:

| বিষয়               | Channel          | Search করো                           |
| ------------------- | ---------------- | ------------------------------------ |
| Node.js Performance | Fireship         | "Node.js performance optimization"   |
| PostgreSQL Indexing | Hussein Nasser   | "PostgreSQL indexing explained"      |
| Redis Caching       | Traversy Media   | "Redis caching Node.js tutorial"     |
| Load Testing k6     | k6 Official      | "k6 load testing tutorial"           |
| MongoDB Performance | MongoDB Official | "MongoDB performance best practices" |

## Frontend Performance:

| বিষয়             | Channel                  | Search করো                       |
| ----------------- | ------------------------ | -------------------------------- |
| Core Web Vitals   | Google Chrome Developers | "Core Web Vitals 2024"           |
| Lighthouse        | Google Chrome Developers | "Lighthouse performance audit"   |
| React Performance | Jack Herrington          | "React performance optimization" |
| Browser DevTools  | Google Chrome Developers | "Chrome DevTools performance"    |

## সম্পূর্ণ Course:

- **Udemy**: "Web Performance Bootcamp: Mastering Speed Techniques" — Backend + Frontend দুটোই আছে
- **YouTube**: "Web Dev Simplified" channel এ performance playlist
- **YouTube**: "Fireship" channel এ "100 seconds" series

---

_Sources: [Vercel Web Vitals Guide](https://vercel.com/guides/optimizing-core-web-vitals-in-2024), [Node.js Performance Guide](https://www.grizzlypeaksoftware.com/library/nodejs-performance-optimization-techniques-79jyr1ys), [MongoDB Best Practices](https://empiricaledge.com/blog/mongodb-performance-optimization-best-practices/), [PostgreSQL Indexing](https://techcloudup.com/2025/06/boost-postgresql-query-speed-mastering/), [Express.js Optimization](https://moldstud.com/articles/p-performance-optimization-techniques-for-scalable-expressjs-apis-boost-your-applications-efficiency)_
