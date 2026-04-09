# সফটওয়্যার ইঞ্জিনিয়ারিং — DRY, SOLID, ACID সম্পূর্ণ নোট

> একজন সিনিয়র সফটওয়্যার ইঞ্জিনিয়ারের চোখ দিয়ে লেখা — বাংলায়, গল্পের মতো করে।

---

## ভূমিকা

তুমি যখন প্রথম কোড লিখতে শুরু করো, তখন শুধু চিন্তা করো — "কাজ হচ্ছে কিনা।"
কিন্তু যখন একটু অভিজ্ঞতা হয়, তখন বুঝতে পারো — কাজ হওয়াটাই যথেষ্ট না।
কোড যেন **বোঝা যায়, পরিবর্তন করা যায়, এবং ভাঙে না** — এটাই আসল লক্ষ্য।

এই তিনটি নীতি — **DRY, SOLID, ACID** — সেই লক্ষ্যে পৌঁছানোর তিনটি আলাদা পথ।

---

# ১. DRY — Don't Repeat Yourself

## গল্পটা শুরু হয় এভাবে

কল্পনা করো তুমি একটা রেস্তোরাঁর menu তৈরি করছো।
প্রতিটা পাতায় তুমি লিখলে — "VAT: 15%"।
এখন সরকার VAT বদলে 18% করলো।
তোমাকে প্রতিটা পাতায় গিয়ে বদলাতে হবে।
একটা পাতা মিস হলেই — ভুল।

এটাই হলো **WET code** — Write Everything Twice।
আর এর সমাধান হলো **DRY** — Don't Repeat Yourself।

## DRY কী?

DRY মানে হলো — **একটা জিনিস একবারই লেখো।**

এই নীতিটা এসেছে Andy Hunt এবং Dave Thomas এর বিখ্যাত বই
**"The Pragmatic Programmer"** থেকে। তাদের কথায়:

> "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."

অর্থাৎ — তোমার সিস্টেমে প্রতিটা তথ্য বা logic এর একটাই জায়গা থাকবে।

## কোড দিয়ে বুঝি

**WET (খারাপ) উদাহরণ:**

```javascript
// matches route এ
const TAX_RATE = 0.15;
const price = basePrice * 1.15;

// payments route এ
const TAX_RATE = 0.15;
const total = amount * 1.15;

// invoices route এ
const finalAmount = cost * 1.15;
```

এখন tax rate বদলালে তিনটা জায়গায় বদলাতে হবে। একটা মিস হলেই bug।

**DRY (ভালো) উদাহরণ:**

```javascript
// utils/tax.js — একটাই জায়গা
export const TAX_RATE = 0.15;
export const applyTax = (amount) => amount * (1 + TAX_RATE);

// matches route এ
import { applyTax } from "../utils/tax.js";
const price = applyTax(basePrice);

// payments route এ
import { applyTax } from "../utils/tax.js";
const total = applyTax(amount);
```

এখন tax rate বদলালে শুধু `utils/tax.js` তে একবার বদলালেই সব জায়গায় ঠিক হয়ে যাবে।

## DRY কোথায় কোথায় প্রযোজ্য?

DRY শুধু code এর জন্য না — এটা সব জায়গায় কাজ করে:

| জায়গা        | WET উদাহরণ                | DRY সমাধান               |
| ------------- | ------------------------- | ------------------------ |
| Code          | একই function বারবার লেখা  | Reusable function বানানো |
| Database      | একই data দুই table এ রাখা | Normalization করা        |
| Config        | একই URL বিভিন্ন ফাইলে     | `.env` বা config file    |
| Documentation | একই কথা বিভিন্ন জায়গায়  | Single source of truth   |

## DRY এর সুবিধা

- **Maintainability**: একটা জায়গায় বদলালেই সব ঠিক হয়
- **Less Bugs**: কম code মানে কম ভুলের সুযোগ
- **Readability**: কোড পড়তে সহজ হয়
- **Reusability**: একই function বারবার ব্যবহার করা যায়

## সতর্কতা — Over-DRY করো না!

DRY এর একটা ফাঁদ আছে। সব কিছু একসাথে করতে গিয়ে অনেকে এমন abstraction বানায়
যেটা বোঝাই যায় না। এটাকে বলে **Wrong Abstraction**।

মনে রেখো — **duplication, wrong abstraction এর চেয়ে ভালো।**
যদি দুটো জিনিস এখন একরকম দেখায় কিন্তু ভবিষ্যতে আলাদা হওয়ার সম্ভাবনা থাকে,
তাহলে আলাদাই রাখো।

---

# ২. SOLID — পাঁচটি নীতির সমষ্টি

## গল্পটা শুরু হয় এভাবে

কল্পনা করো তুমি একটা বড় কারখানা বানাচ্ছো।
শুরুতে সব কাজ একজনই করে — সে কাঁচামাল আনে, তৈরি করে, প্যাক করে, ডেলিভারি দেয়।
কারখানা ছোট থাকলে এটা চলে।

কিন্তু কারখানা বড় হলে? একজনের পক্ষে সব সামলানো অসম্ভব।
তখন দরকার হয় — আলাদা আলাদা দায়িত্ব, আলাদা আলাদা বিভাগ।

SOLID ঠিক এই কাজটাই করে — তোমার code কে সুন্দরভাবে ভাগ করে দেয়।

## SOLID কী?

SOLID হলো পাঁচটি নীতির প্রথম অক্ষর দিয়ে তৈরি একটি শব্দ।
এটা তৈরি করেছেন **Robert C. Martin (Uncle Bob)**।

```
S — Single Responsibility Principle (SRP)
O — Open/Closed Principle (OCP)
L — Liskov Substitution Principle (LSP)
I — Interface Segregation Principle (ISP)
D — Dependency Inversion Principle (DIP)
```

একটা একটা করে বুঝি।

---

## S — Single Responsibility Principle (SRP)

### নীতি

> একটা class বা function এর **একটাই কাজ** থাকবে।

### গল্প

তোমার বাসায় একজন কাজের মানুষ আছে।
সে রান্না করে, বাজার করে, বাচ্চা দেখে, গাড়ি চালায়।
একদিন সে অসুস্থ হলো — সব কাজ বন্ধ।

এটাই SRP ভাঙার সমস্যা।

### কোড উদাহরণ

**খারাপ (SRP ভাঙা):**

```javascript
class MatchManager {
  createMatch(data) {
    /* DB তে save */
  }
  sendEmail(match) {
    /* Email পাঠানো */
  }
  generateReport(match) {
    /* Report তৈরি */
  }
  broadcastToWebSocket(match) {
    /* WS broadcast */
  }
}
```

এই class এর চারটা আলাদা কারণে পরিবর্তন হতে পারে।
Email logic বদলালে, DB logic বদলালে, সব এক জায়গায়।

**ভালো (SRP মানা):**

```javascript
class MatchRepository {
  create(data) {
    /* শুধু DB */
  }
}

class EmailService {
  sendMatchCreated(match) {
    /* শুধু Email */
  }
}

class MatchBroadcaster {
  broadcast(match) {
    /* শুধু WebSocket */
  }
}
```

এখন প্রতিটা class এর একটাই দায়িত্ব। একটা বদলালে বাকিগুলো অক্ষত থাকে।

---

## O — Open/Closed Principle (OCP)

### নীতি

> Code **নতুন feature এর জন্য open** থাকবে, কিন্তু **পুরনো code বদলানোর জন্য closed**।

### গল্প

তোমার ফোনে নতুন app install করতে পারো — ফোনের hardware বদলাতে হয় না।
এটাই OCP।

### কোড উদাহরণ

**খারাপ:**

```javascript
function getMatchStatus(match) {
  if (match.type === "football") {
    return calculateFootballStatus(match);
  } else if (match.type === "cricket") {
    return calculateCricketStatus(match);
  }
  // নতুন sport যোগ করতে এই function বদলাতে হবে
}
```

**ভালো:**

```javascript
// প্রতিটা sport নিজের status calculate করে
class FootballMatch {
  getStatus() {
    return calculateFootballStatus(this);
  }
}

class CricketMatch {
  getStatus() {
    return calculateCricketStatus(this);
  }
}

// নতুন sport? শুধু নতুন class বানাও, পুরনো code ছুঁতে হবে না
class BasketballMatch {
  getStatus() {
    return calculateBasketballStatus(this);
  }
}
```

---

## L — Liskov Substitution Principle (LSP)

### নীতি

> Parent class এর জায়গায় Child class বসালে **program ঠিকমতো কাজ করতে হবে।**

### গল্প

তোমার অফিসে "Manager" পদে যে কেউ বসলে অফিস চলবে।
কিন্তু যদি এমন Manager আসে যে কোনো decision নিতে পারে না —
সে technically Manager, কিন্তু কাজ করে না।
এটাই LSP ভাঙা।

### কোড উদাহরণ

**খারাপ (LSP ভাঙা):**

```javascript
class Bird {
  fly() {
    console.log("উড়ছি!");
  }
}

class Penguin extends Bird {
  fly() {
    throw new Error("পেঙ্গুইন উড়তে পারে না!"); // LSP ভাঙলো
  }
}

// এখন Bird এর জায়গায় Penguin বসালে program crash করবে
```

**ভালো:**

```javascript
class Bird {
  move() {
    /* সব পাখি নড়তে পারে */
  }
}

class FlyingBird extends Bird {
  fly() {
    console.log("উড়ছি!");
  }
}

class Penguin extends Bird {
  swim() {
    console.log("সাঁতার কাটছি!");
  }
}
```

---

## I — Interface Segregation Principle (ISP)

### নীতি

> একটা বড় interface এর চেয়ে **ছোট ছোট specific interface** ভালো।
> কাউকে এমন কিছু implement করতে বাধ্য করো না যা তার দরকার নেই।

### গল্প

তোমার অফিসে একটা form আছে — সবাইকে পূরণ করতে হয়।
Form এ আছে: নাম, বয়স, গাড়ির লাইসেন্স নম্বর, পাইলট লাইসেন্স নম্বর।
যার গাড়ি নেই, সে কী লিখবে? N/A।
এটাই ISP ভাঙা।

### কোড উদাহরণ

**খারাপ:**

```javascript
// সব match কে এই সব implement করতে হবে
class Match {
  getScore() {}
  getCommentary() {}
  getLiveStream() {} // সব match এ live stream নেই
  getTicketPrice() {} // সব match এ ticket নেই
}
```

**ভালো:**

```javascript
class BasicMatch {
  getScore() {}
}

class CommentaryMatch extends BasicMatch {
  getCommentary() {}
}

class LiveMatch extends BasicMatch {
  getLiveStream() {}
  getTicketPrice() {}
}
```

---

## D — Dependency Inversion Principle (DIP)

### নীতি

> High-level module, low-level module এর উপর **directly নির্ভর করবে না।**
> দুটোই **abstraction** এর উপর নির্ভর করবে।

### গল্প

তোমার ঘরে বাল্ব লাগানো আছে।
বাল্ব বদলাতে হলে কি দেওয়াল ভাঙতে হয়? না।
কারণ socket (abstraction) আছে — যেকোনো বাল্ব লাগানো যায়।
এটাই DIP।

### কোড উদাহরণ

**খারাপ:**

```javascript
class MatchService {
  constructor() {
    this.db = new PostgresDatabase(); // সরাসরি নির্ভরতা
  }
  createMatch(data) {
    this.db.insert(data);
  }
}
// এখন MongoDB তে switch করতে হলে MatchService বদলাতে হবে
```

**ভালো:**

```javascript
class MatchService {
  constructor(database) {
    // abstraction inject করা হচ্ছে
    this.db = database;
  }
  createMatch(data) {
    this.db.insert(data);
  }
}

// যেকোনো database দিয়ে কাজ করবে
const service = new MatchService(new PostgresDatabase());
const service2 = new MatchService(new MongoDatabase());
```

## SOLID এর সারসংক্ষেপ

| নীতি | এক কথায়                         | মনে রাখার উপায়    |
| ---- | -------------------------------- | ------------------ |
| S    | একটা class, একটা কাজ             | "এক কাজের মানুষ"   |
| O    | নতুন যোগ করো, পুরনো ছুঁয়ো না    | "ফোনে app install" |
| L    | বাচ্চা বাপের জায়গায় বসতে পারবে | "যোগ্য উত্তরসূরি"  |
| I    | ছোট ছোট interface                | "দরকারি form"      |
| D    | abstraction এর উপর নির্ভর করো    | "socket এ বাল্ব"   |

---

# ৩. ACID — Database Transaction এর চার স্তম্ভ

## গল্পটা শুরু হয় এভাবে

তুমি ব্যাংকে গেলে। তোমার account থেকে বন্ধুর account এ ১০,০০০ টাকা পাঠাবে।

এই কাজে দুটো ধাপ আছে:

1. তোমার account থেকে ১০,০০০ কাটো
2. বন্ধুর account এ ১০,০০০ যোগ করো

এখন মাঝখানে যদি server crash করে?
তোমার টাকা কাটা গেছে, কিন্তু বন্ধু পায়নি।
১০,০০০ টাকা হাওয়া!

এই সমস্যা সমাধানের জন্যই ACID।

## ACID কী?

ACID হলো database transaction এর চারটি গুণ:

```
A — Atomicity    (সব হবে, নয়তো কিছুই না)
C — Consistency  (data সবসময় valid থাকবে)
I — Isolation    (একসাথে অনেক transaction চললেও সমস্যা নেই)
D — Durability   (একবার save হলে হারাবে না)
```

PostgreSQL (তোমার project এ যেটা আছে) সম্পূর্ণ ACID compliant।

---

## A — Atomicity (অবিভাজ্যতা)

### নীতি

> Transaction এর সব operation **একসাথে সফল হবে**, নয়তো **সবকিছু বাতিল হবে।**
> মাঝামাঝি কোনো অবস্থা থাকবে না।

### গল্প

তুমি একটা চুক্তি সই করছো।
হয় দুজনেই সই করবে — নয়তো কেউই করবে না।
একজন সই করলো, আরেকজন করলো না — এটা valid না।

### উদাহরণ

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 10000 WHERE id = 'hamza';
UPDATE accounts SET balance = balance + 10000 WHERE id = 'friend';

COMMIT; -- দুটোই সফল হলে save হবে
-- যদি কোনো একটা fail করে, ROLLBACK হবে — কিছুই হবে না
```

### Drizzle ORM এ (তোমার project):

```javascript
await db.transaction(async (tx) => {
  await tx
    .update(accounts)
    .set({ balance: sql`balance - 10000` })
    .where(eq(accounts.id, "hamza"));

  await tx
    .update(accounts)
    .set({ balance: sql`balance + 10000` })
    .where(eq(accounts.id, "friend"));
  // যদি এখানে error হয়, উপরের update ও rollback হবে
});
```

---

## C — Consistency (সামঞ্জস্যতা)

### নীতি

> Transaction এর আগে এবং পরে **database সবসময় valid state এ থাকবে।**
> কোনো rule ভাঙবে না।

### গল্প

ব্যাংকের নিয়ম — account balance কখনো negative হবে না।
তুমি ১০,০০০ টাকা পাঠাতে চাইছো, কিন্তু তোমার account এ আছে ৫,০০০।
Consistency নিশ্চিত করবে — এই transaction হবেই না।

### উদাহরণ

```sql
-- Database constraint
ALTER TABLE accounts ADD CONSTRAINT positive_balance CHECK (balance >= 0);

-- এখন কেউ negative করতে চাইলে database নিজেই reject করবে
UPDATE accounts SET balance = -5000 WHERE id = 'hamza';
-- ERROR: new row violates check constraint "positive_balance"
```

### তোমার project এ (Drizzle Schema):

```javascript
// src/db/schema.js
export const matches = pgTable("matches", {
  homeScore: integer("home_score").default(0).notNull(), // negative হবে না
  status: matchStatusEnum("status").notNull(), // valid status ছাড়া insert হবে না
});
```

---

## I — Isolation (বিচ্ছিন্নতা)

### নীতি

> একসাথে অনেক transaction চললেও **একটা আরেকটাকে প্রভাবিত করবে না।**
> প্রতিটা transaction মনে করবে সে একাই কাজ করছে।

### গল্প

তুমি আর তোমার বন্ধু একই সময়ে একই concert এর শেষ ২টা ticket কিনতে চাইছো।
Isolation নিশ্চিত করবে — দুজনেই একটা করে পাবে, বা একজন পাবে আরেকজন পাবে না।
কিন্তু দুজনেই একই ticket পাবে না।

### Isolation Levels (কঠোরতার মাত্রা)

```
Read Uncommitted  → সবচেয়ে কম কঠোর (fast, কিন্তু risky)
Read Committed    → PostgreSQL এর default
Repeatable Read   → মাঝামাঝি
Serializable      → সবচেয়ে কঠোর (slow, কিন্তু safe)
```

### উদাহরণ — Race Condition সমস্যা

```javascript
// দুজন একই সময়ে শেষ ticket কিনতে চাইছে

// Transaction 1 (Hamza)
const ticket = await db.select().from(tickets).where(eq(tickets.id, 1));
// ticket.available = 1 দেখলো

// Transaction 2 (Friend) — একই সময়ে
const ticket = await db.select().from(tickets).where(eq(tickets.id, 1));
// সেও ticket.available = 1 দেখলো

// দুজনেই কিনলো — এখন available = -1 ??
```

**Isolation দিয়ে সমাধান:**

```javascript
await db.transaction(async (tx) => {
  // FOR UPDATE lock করে দেয় — অন্য transaction wait করবে
  const [ticket] = await tx.execute(
    sql`SELECT * FROM tickets WHERE id = 1 FOR UPDATE`,
  );

  if (ticket.available > 0) {
    await tx
      .update(tickets)
      .set({ available: sql`available - 1` })
      .where(eq(tickets.id, 1));
  }
});
```

---

## D — Durability (স্থায়িত্ব)

### নীতি

> একবার **COMMIT** হলে data **চিরতরে save** হয়ে যাবে।
> Server crash করলেও, power চলে গেলেও — data থাকবে।

### গল্প

তুমি ব্যাংকে টাকা জমা দিলে।
ব্যাংক বললো "হয়ে গেছে।"
এরপর ব্যাংকের server বন্ধ হয়ে গেলেও তোমার টাকা থাকবে।
কারণ তারা disk এ লিখে রেখেছে।

### কীভাবে কাজ করে?

PostgreSQL Durability নিশ্চিত করে **WAL (Write-Ahead Logging)** দিয়ে:

```
1. Transaction COMMIT হওয়ার আগে, PostgreSQL একটা log file এ লেখে
2. তারপর actual data file এ লেখে
3. Server crash হলে, restart এ log দেখে data recover করে
```

```sql
-- এই COMMIT হওয়ার পর data চিরতরে safe
BEGIN;
INSERT INTO matches (home_team, away_team) VALUES ('Arsenal', 'Chelsea');
COMMIT; -- এখন disk এ লেখা হলো, আর হারাবে না
```

---

## ACID এর সারসংক্ষেপ

| Property    | মানে                 | ব্যর্থ হলে কী হয়               |
| ----------- | -------------------- | ------------------------------- |
| Atomicity   | সব বা কিছুই না       | টাকা কাটা গেছে কিন্তু পৌঁছায়নি |
| Consistency | data সবসময় valid    | negative balance হয়ে গেছে      |
| Isolation   | transaction আলাদা    | দুজন একই ticket পেয়ে গেছে      |
| Durability  | commit হলে হারাবে না | server restart এ data গেছে      |

## ACID vs NoSQL

একটা গুরুত্বপূর্ণ কথা — MongoDB, Redis এর মতো NoSQL database গুলো
traditionally ACID fully support করে না (যদিও MongoDB 4.0+ থেকে transactions আছে)।

তারা **BASE** model follow করে:

- **B**asically Available
- **S**oft state
- **E**ventually consistent

তোমার project এ PostgreSQL আছে — তাই তুমি full ACID পাচ্ছো।

---

# ৪. TDD — Test Driven Development

## গল্পটা শুরু হয় এভাবে

কল্পনা করো তুমি একটা নতুন বাড়ি বানাচ্ছো।
সাধারণত কী হয়? আগে বাড়ি বানাও, তারপর দেখো ছাদ লিক করছে কিনা।
লিক করলে ভাঙো, ঠিক করো — অনেক কষ্ট।

TDD বলে — আগে ঠিক করো "ছাদ লিক করবে না" এই শর্তটা।
তারপর বাড়ি বানাও সেই শর্ত মেনে।
শর্ত পূরণ না হলে বাড়ি accept করবে না।

এটাই TDD — **আগে test, তারপর code।**

## TDD কী?

TDD মানে হলো — **Test Driven Development।**
অর্থাৎ, test লেখাই তোমার code এর design কে drive করে।

এই পদ্ধতিতে:

1. আগে test লেখো (যেটা fail করবে)
2. তারপর code লেখো (test pass করানোর জন্য)
3. তারপর code clean করো

এটা তৈরি করেছেন **Kent Beck** — Extreme Programming এর জনক।

## TDD এর মূল চক্র — Red, Green, Refactor

```
🔴 RED    → Test লেখো (fail করবে, কারণ code নেই)
      ↓
🟢 GREEN  → Minimum code লেখো (test pass করাও)
      ↓
🔵 REFACTOR → Code clean করো (test pass রেখে)
      ↓
🔴 RED    → পরের feature এর জন্য আবার test লেখো
      ↓
      (চক্র চলতে থাকে)
```

এই তিনটি ধাপ বারবার ঘুরতে থাকে — প্রতিটা ছোট feature এর জন্য।

## হাতে-কলমে উদাহরণ — Node.js এ

ধরো তুমি `getMatchStatus()` function বানাবে।

### 🔴 Step 1: RED — আগে test লেখো

```javascript
// match-status.test.js
import { getMatchStatus } from "./match-status.js";

// এখনো function লেখাই হয়নি — test fail করবে
test("match শুরু না হলে status scheduled হবে", () => {
  const future = new Date(Date.now() + 3600000); // ১ ঘণ্টা পরে
  const result = getMatchStatus(future, new Date(future.getTime() + 7200000));
  expect(result).toBe("scheduled"); // 🔴 FAIL — function নেই
});
```

Test run করো:

```bash
node --test match-status.test.js
# ❌ ReferenceError: getMatchStatus is not defined
```

এটাই **Red** — test fail করছে। এটা ভালো! মানে test কাজ করছে।

### 🟢 Step 2: GREEN — Minimum code লেখো

```javascript
// match-status.js — শুধু test pass করানোর জন্য
export function getMatchStatus(startTime, endTime, now = new Date()) {
  if (now < startTime) return "scheduled";
  // বাকিটা পরে
}
```

Test আবার run করো:

```bash
node --test match-status.test.js
# ✅ PASS
```

এটাই **Green** — test pass করছে।

### 🔵 Step 3: REFACTOR — Code clean করো

```javascript
// match-status.js — clean version
export function getMatchStatus(startTime, endTime, now = new Date()) {
  if (now < startTime) return "scheduled";
  if (now > endTime) return "finished";
  return "live";
}
```

Test আবার run করো — এখনো pass করছে কিনা দেখো।

### 🔴 Step 4: পরের feature এর জন্য নতুন test

```javascript
test("match চলাকালীন status live হবে", () => {
  const past = new Date(Date.now() - 3600000); // ১ ঘণ্টা আগে শুরু
  const future = new Date(Date.now() + 3600000); // ১ ঘণ্টা পরে শেষ
  expect(getMatchStatus(past, future)).toBe("live"); // 🔴 FAIL (এখনো)
});
```

এভাবে চক্র চলতে থাকে।

## AAA Pattern — Test লেখার সঠিক পদ্ধতি

প্রতিটা test তিনটা ভাগে লেখো:

```javascript
test("match শেষ হলে status finished হবে", () => {
  // Arrange — data তৈরি করো
  const startTime = new Date("2024-01-01T10:00:00");
  const endTime = new Date("2024-01-01T12:00:00");
  const now = new Date("2024-01-01T13:00:00"); // শেষ হওয়ার পরে

  // Act — function call করো
  const result = getMatchStatus(startTime, endTime, now);

  // Assert — result check করো
  expect(result).toBe("finished");
});
```

**Arrange** → test এর জন্য data তৈরি করো
**Act** → function/method call করো
**Assert** → result যা হওয়া উচিত তা check করো

## TDD এর সুবিধা

**১. Bug কম হয়**
Code লেখার আগেই behavior define করা থাকে। Bug ঢোকার সুযোগ কম।

**২. Design ভালো হয়**
Test লিখতে গিয়ে বুঝতে পারো function টা কতটা জটিল।
জটিল হলে ভাঙো — এতে design automatically ভালো হয়।

**৩. Refactor করতে ভয় লাগে না**
Test আছে মানে যেকোনো সময় code বদলাতে পারো।
Test fail করলে বুঝবে কোথায় ভুল হলো।

**৪. Documentation হয়ে যায়**
Test গুলো পড়লেই বোঝা যায় code কী করে।

```javascript
// এই test গুলো পড়লেই getMatchStatus এর behavior বোঝা যায়
test("match শুরু না হলে scheduled");
test("match চলাকালীন live");
test("match শেষ হলে finished");
```

## TDD এর সীমাবদ্ধতা

TDD সব জায়গায় perfect না:

| কোথায় ভালো কাজ করে | কোথায় কঠিন             |
| ------------------- | ----------------------- |
| Business logic      | UI/UX design            |
| API endpoints       | Database migration      |
| Utility functions   | Third-party integration |
| Algorithm           | Exploratory code        |

## TDD vs Traditional Testing

```
Traditional (পুরনো পদ্ধতি):
Code লেখো → Test লেখো → Bug খোঁজো → Fix করো

TDD (নতুন পদ্ধতি):
Test লেখো → Code লেখো → Refactor করো → পরের feature
```

**মূল পার্থক্য**: Traditional এ test হলো "verification" — কাজ হয়েছে কিনা দেখা।
TDD তে test হলো "specification" — কী হওয়া উচিত তা define করা।

## তোমার Project এ TDD (Node.js)

তোমার project এ `node --test` built-in আছে। আলাদা কিছু install লাগবে না।

```javascript
// src/utils/match-status.test.js
import { test } from "node:test";
import assert from "node:assert";
import { getMatchStatus } from "./match-status.js";

test("scheduled match", () => {
  const start = new Date(Date.now() + 3600000);
  const end = new Date(Date.now() + 7200000);
  assert.strictEqual(getMatchStatus(start, end), "scheduled");
});

test("live match", () => {
  const start = new Date(Date.now() - 3600000);
  const end = new Date(Date.now() + 3600000);
  assert.strictEqual(getMatchStatus(start, end), "live");
});
```

```bash
# Run করো
node --test src/utils/match-status.test.js
```

---

# চারটি নীতির তুলনা

|                   | DRY                   | SOLID                   | ACID                 | TDD                 |
| ----------------- | --------------------- | ----------------------- | -------------------- | ------------------- |
| কোথায় কাজ করে    | Code                  | Code Architecture       | Database             | Development Process |
| মূল লক্ষ্য        | Duplication কমানো     | Code structure ঠিক রাখা | Data integrity রক্ষা | Bug-free code       |
| কে ব্যবহার করে    | Developer             | Architect/Developer     | Database/Developer   | Developer           |
| সমস্যা সমাধান করে | Maintenance nightmare | Spaghetti code          | Data corruption      | Regression bugs     |

---

# শেষ কথা

এই তিনটি নীতি আলাদা আলাদা সমস্যার সমাধান করে, কিন্তু একসাথে কাজ করলে
তোমার software হয়:

- **DRY** → কম code, কম bug, সহজ maintenance
- **SOLID** → flexible, testable, scalable architecture
- **ACID** → reliable, consistent, trustworthy data
- **TDD** → bug কম, refactor এ ভয় নেই, code self-documented

একজন junior developer code লেখে যেটা কাজ করে।
একজন senior developer code লেখে যেটা কাজ করে, বোঝা যায়, এবং ভবিষ্যতে পরিবর্তন করা যায়।

এই তিনটি নীতি তোমাকে সেই senior developer হতে সাহায্য করবে।

---

_Sources: [MDN Web Docs](https://developer.mozilla.org), [GeeksforGeeks](https://geeksforgeeks.org), [FreeCodeCamp](https://freecodecamp.org), [The Pragmatic Programmer — Andy Hunt & Dave Thomas], [Clean Code — Robert C. Martin], [TDD Guide — testdevlab.com](https://www.testdevlab.com/blog/test-driven-development-for-beginners), [Red Green Refactor — codelucky.com](https://codelucky.com/test-driven-development-red-green-refactor-cycle/)_
