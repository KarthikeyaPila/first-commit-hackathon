# India News RSS Feed Registry — First Commit

_Last checked: 17 September 2026 (IST)_

This registry is for the First Commit news-comparison project.

## Important verification note

I verified the feed URLs against the publishers' **current official RSS directories/pages** and attempted direct fetches through the available web retrieval layer.

For raw RSS/XML endpoints, the browser often returns messages such as `Unsupported content-type: application/rss+xml`, `application/xml`, or `text/xml`. That means the endpoint responded with an XML feed that the browser renderer did not parse as a normal webpage; it is **not** the same as a 404.

I have therefore separated:

- **Verified / directory-confirmed** — exact URL is published by the source's current RSS directory, and the endpoint was reachable enough to return an RSS/XML response where direct checking was possible.
- **Officially listed, direct fetch blocked** — exact URL is in the official directory, but this validation environment received a 403/robots/error before the XML could be checked.
- **Pending** — a useful state feed was found, but I could not verify a stable direct RSS endpoint, so I did not invent one.

## Current recommendation

For the first technical experiment, start with:

1. Maharashtra
2. West Bengal
3. Uttar Pradesh
4. Rajasthan
5. Bihar
6. Karnataka
7. Kerala
8. Tamil Nadu

Andhra Pradesh is kept as a **pending-source state** below because I found strong active AP coverage but not a direct state RSS endpoint I can confidently verify from the current official directories.

---

# 1. National Sources

These feeds should be treated as `scope = NATIONAL`.

| Source | Feed | Verification |
|---|---|---|
| NDTV — India | https://feeds.feedburner.com/ndtvnews-india-news | ✅ Official NDTV RSS page confirms an India feed; direct XML endpoint returned XML to the validator layer |
| Hindustan Times — India | https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml | ✅ Listed in official HT RSS directory; direct endpoint returned XML |
| Times of India — India | https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms | ✅ Linked from official TOI RSS directory; direct endpoint returned XML |
| The Indian Express — India | https://indianexpress.com/section/india/feed/ | 🟡 Official RSS directory confirms exact URL; direct automated fetch was blocked by the site's access controls |
| The Hindu — National | https://www.thehindu.com/news/national/feeder/default.rss | 🟡 URL is a known national RSS endpoint, but direct validation was blocked by robots.txt in this environment; test locally before activation |

### Official RSS directories

- NDTV: https://www.ndtv.com/rss?site=classic
- Hindustan Times: https://www.hindustantimes.com/rss
- Times of India: https://timesofindia.indiatimes.com/rss.cms
- The Indian Express: https://indianexpress.com/rss/

---

# 2. State-Specific / City-Scoped Sources

> A feed below is considered state-specific when the feed itself is scoped to a state or a city within that state. The publisher may still be a national publisher.

## Maharashtra

### Mumbai

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Mumbai | https://indianexpress.com/section/cities/mumbai/feed/ | ✅ Official IE RSS directory; direct endpoint returned RSS/XML response |
| Hindustan Times — Mumbai | https://www.hindustantimes.com/feeds/rss/cities/mumbai-news/rssfeed.xml | ✅ Official HT RSS directory; direct endpoint returned XML |
| Times of India — Mumbai | https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms | ✅ Official TOI RSS directory; direct endpoint returned XML |

### Pune (optional additional feed)

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Pune | https://indianexpress.com/section/cities/pune/feed/ | ✅ Official IE RSS directory; direct endpoint returned RSS/XML |
| Hindustan Times — Pune | https://www.hindustantimes.com/feeds/rss/cities/pune-news/rssfeed.xml | ✅ Official HT RSS directory; direct endpoint returned XML |
| Times of India — Pune | https://timesofindia.indiatimes.com/rssfeeds/-2128821991.cms | ✅ Official TOI RSS directory; direct endpoint returned XML |

**State readiness:** ✅ Excellent. Multiple publishers and multiple city feeds.

---

## West Bengal

### Kolkata

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Kolkata | https://indianexpress.com/section/cities/kolkata/feed/ | ✅ Official IE RSS directory; endpoint returned RSS/XML response |
| Hindustan Times — Kolkata | https://www.hindustantimes.com/feeds/rss/cities/kolkata-news/rssfeed.xml | ✅ Official HT RSS directory; endpoint returned XML |
| Times of India — Kolkata | https://timesofindia.indiatimes.com/rssfeeds/-2128830821.cms | ✅ Official TOI RSS directory; endpoint returned XML |

**State readiness:** ✅ Excellent.

---

## Uttar Pradesh

### Lucknow

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Lucknow | https://indianexpress.com/section/cities/lucknow/feed/ | ✅ Official IE RSS directory; endpoint returned RSS/XML response |
| Hindustan Times — Lucknow | https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml | ✅ Official HT RSS directory; endpoint returned XML |
| Times of India — Lucknow | https://timesofindia.indiatimes.com/rssfeeds/-2128819658.cms | ✅ Official TOI RSS directory; endpoint returned XML / successful response |

**State readiness:** ✅ Excellent.

---

## Rajasthan

### Jaipur

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Jaipur | https://indianexpress.com/section/cities/jaipur/feed/ | ✅ Official IE RSS directory; endpoint returned RSS/XML response |
| Hindustan Times — Jaipur | https://www.hindustantimes.com/feeds/rss/cities/jaipur-news/rssfeed.xml | ✅ Official HT RSS directory; endpoint returned XML |
| Times of India — Jaipur | https://timesofindia.indiatimes.com/rssfeeds/3012544.cms | ✅ Linked from official TOI RSS directory; endpoint returned XML |

**State readiness:** ✅ Excellent.

---

## Bihar

### Patna

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Patna | https://indianexpress.com/section/cities/patna/feed/ | ✅ Official IE RSS directory; endpoint responded successfully |
| Hindustan Times — Patna | https://www.hindustantimes.com/feeds/rss/cities/patna-news/rssfeed.xml | ✅ Official HT RSS directory; endpoint returned XML |
| Times of India — Patna | https://timesofindia.indiatimes.com/rssfeeds/-2128817995.cms | ✅ Linked from official TOI RSS directory; endpoint returned XML |

**State readiness:** ✅ Excellent.

---

## Karnataka

### Bengaluru / Bangalore

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Bangalore | https://indianexpress.com/section/cities/bangalore/feed/ | 🟡 Official IE RSS directory confirms URL; direct fetch was blocked by access controls in this environment |
| Hindustan Times — Bengaluru | https://www.hindustantimes.com/feeds/rss/cities/bengaluru-news/rssfeed.xml | 🟡 Official HT RSS directory confirms URL; direct automated fetch failed before XML parsing |
| Times of India — Bangalore | https://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms | ✅ Linked from official TOI RSS directory; endpoint returned XML |

**State readiness:** 🟡 Good, but locally verify the IE and HT feeds before activating.

---

## Kerala

### State / Thiruvananthapuram

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Kerala | https://indianexpress.com/section/india/kerala/feed/ | ✅ Official IE RSS directory; endpoint responded |
| The Indian Express — Thiruvananthapuram | https://indianexpress.com/section/cities/thiruvananthapuram/feed/ | 🟡 Official IE RSS directory confirms URL; direct fetch was a cache/access failure in this environment |
| Times of India — Thiruvananthapuram | https://timesofindia.indiatimes.com/rssfeeds/3831863.cms | ✅ Linked from official TOI RSS directory; endpoint responded successfully |
| New Indian Express — Kerala XML feed endpoint | https://www.newindianexpress.com/states/kerala?getXmlFeed=true&widgetId=534391&widgetName=rssfeed | 🟡 Current TNIE state RSS endpoint was found and is actively serving current Kerala articles; validate with a local RSS parser before production |

**State readiness:** ✅/🟡 Good. The TNIE feed is particularly useful because it provides a publisher distinct from IE/TOI.

---

## Tamil Nadu

### Chennai / Coimbatore

| Source | Feed | Verification |
|---|---|---|
| The Indian Express — Chennai | https://indianexpress.com/section/cities/chennai/feed/ | 🟡 Official IE RSS directory confirms URL; direct fetch was blocked by access controls in this environment |
| Times of India — Chennai | https://timesofindia.indiatimes.com/rssfeeds/2950623.cms | ✅ Official TOI RSS directory; endpoint returned XML |
| Times of India — Coimbatore | https://timesofindia.indiatimes.com/rssfeeds/7503091.cms | ✅ Official TOI RSS directory; endpoint responded successfully |

**State readiness:** 🟡 Usable for a first pass, but source diversity is weaker than Maharashtra / West Bengal / UP / Rajasthan / Bihar.

---

# 3. Andhra Pradesh — Pending Direct RSS Verification

Andhra Pradesh is still a strong candidate for the product and demo, but I am **not putting guessed feed URLs into the registry**.

### Sources confirmed to have strong current AP coverage

| Source | Current coverage | Status |
|---|---|---|
| New Indian Express — Andhra Pradesh | https://www.newindianexpress.com/topic/andhra-pradesh | ✅ Active AP coverage; direct RSS XML endpoint not verified |
| Times of India — Andhra Pradesh / Amaravati / Vijayawada / Visakhapatnam | https://timesofindia.indiatimes.com/india/andhra-pradesh/75 | ✅ Active AP coverage; a direct AP RSS endpoint was not exposed in the current official RSS city list I verified |
| Deccan Chronicle — Andhra Pradesh | https://www.deccanchronicle.com/southern-states/andhra-pradesh | ✅ Active AP coverage; direct RSS endpoint not verified |

**Do not add invented RSS URLs for these sources.**

For AP, I would first inspect the source HTML/feed metadata locally and/or contact the publisher if necessary.

---

# 4. Extra useful state feeds discovered

The publishers expose many more state/city feeds than the initial 8-state set.

### The Indian Express

The current official RSS directory exposes feeds for many locations, including:

- Ahmedabad
- Bangalore
- Bhubaneswar
- Chennai
- Goa
- Hyderabad
- Jaipur
- Kerala
- Kolkata
- Lucknow
- Mumbai
- Pune
- Patna
- Mangaluru
- Mysuru
- Nagpur
- Nashik
- and many others.

Official directory:
https://indianexpress.com/rss/

### Hindustan Times

The current RSS directory exposes feeds including:

- Bengaluru
- Jaipur
- Kolkata
- Lucknow
- Mumbai
- Pune
- Patna
- Ranchi
- Chandigarh
- Noida
- Gurugram
- Dehradun
- and others.

Official directory:
https://www.hindustantimes.com/rss

### Times of India

The current RSS directory exposes city feeds including:

- Mumbai
- Delhi
- Bangalore
- Hyderabad
- Chennai
- Kolkata
- Pune
- Lucknow
- Patna
- Jaipur
- Nagpur
- Thiruvananthapuram
- Coimbatore
- and many others.

Official directory:
https://timesofindia.indiatimes.com/rss.cms

---

# 5. Recommended source registry structure

Do not store only a feed URL.

Use:

```yaml
source_id: toi_mumbai
publisher: Times of India
publisher_scope: NATIONAL
feed_scope: STATE
state: Maharashtra
city: Mumbai
language: en
rss_url: https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms
active: true
verification_status: verified
last_verified_at: 2026-09-17
```

For a genuinely regional publisher:

```yaml
publisher_scope: REGIONAL
feed_scope: STATE
state: Kerala
```

This lets the UI distinguish:

> National publisher's state feed

from:

> Regional/state publisher

without treating them as the same thing.

---

# 6. Legal / usage warning

**Technical availability does not automatically mean permission to publicly aggregate the feed.**

This is important for this project.

### The Indian Express

Their RSS page states that RSS consumption is for **personal and non-commercial use** and says reproducing/copying content may require permission.  
Source: https://indianexpress.com/rss/

### NDTV

NDTV says its RSS feeds are provided free for **personal, non-commercial use**, with attribution to NDTV.  
Source: https://www.ndtv.com/rss?site=classic

### Times of India

TOI's RSS terms are restrictive: they state that the feeds are for personal use and prohibit displaying/hosting/aggregating or commercial use without consent.  
Source: https://timesofindia.indiatimes.com/rss.cms

Therefore:

> Use these feeds for the local clustering experiment only unless you confirm that your public hackathon deployment is covered by the publisher's permitted use or you obtain permission.

For the public demo, prefer sources whose feed terms explicitly permit the intended use, or get permission where required.

---

# 7. First experiment registry

For the embedding benchmark, do NOT fetch every feed above.

Start with:

```text
Maharashtra
  - The Indian Express — Mumbai
  - Hindustan Times — Mumbai
  - Times of India — Mumbai

West Bengal
  - The Indian Express — Kolkata
  - Hindustan Times — Kolkata
  - Times of India — Kolkata

Uttar Pradesh
  - The Indian Express — Lucknow
  - Hindustan Times — Lucknow
  - Times of India — Lucknow
```

This gives us:

> 3 states × 3 publishers = 9 feeds

and a very clean dataset for testing whether embeddings can detect same-story coverage.

After clustering works:

> add Rajasthan → Bihar → Karnataka → Kerala → Tamil Nadu.

---

# 8. Bottom line

### Strongest immediately verified groups

1. Maharashtra
2. West Bengal
3. Uttar Pradesh
4. Rajasthan
5. Bihar

### Good but needs local verification

6. Karnataka
7. Kerala
8. Tamil Nadu

### Important but feed endpoint still unresolved

9. Andhra Pradesh
10. Telangana

Do not expand the feed registry simply because a publisher has a state page. For this project, the registry should contain **real RSS endpoints that can be parsed by `feedparser`/equivalent**, not guessed URLs.

## Sources used for verification

- The Indian Express RSS directory: https://indianexpress.com/rss/
- Hindustan Times RSS directory: https://www.hindustantimes.com/rss
- Times of India RSS directory: https://timesofindia.indiatimes.com/rss.cms
- NDTV RSS directory: https://www.ndtv.com/rss?site=classic
- New Indian Express RSS/current state feeds: https://www.newindianexpress.com/topic/rss
