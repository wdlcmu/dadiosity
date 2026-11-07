/* Dadiosity ask panel (SPEC-DADIO-ASKPANEL-1): the /ask lesson matcher,
   in place on the homepage and the question pages. The matcher block
   below is byte-identical to the one ask.html runs (extracted, never
   retyped); the panel tail only adds the door and the sheet. The
   matcher itself runs on the visitor's device; the panel's chat door
   sends the words to /api/chat, and nothing is saved there
   (SPEC-DAD-COLDQA1106-02: one privacy story, said plainly on both
   surfaces — /ask sends nothing, this button sends to the AI chat). */
(function () {
"use strict";
var DADIO_STOP = {};
("a an the is it to of and or i my me she he her him we you your yours our at on in for with so do does did what how why when will would can could am are was were be been being have has had not no yes if but as by from this that these those there here just very really tonight today every each one two three about into over under again more most other some any all").split(" ").forEach(function (w) { DADIO_STOP[w] = 1; });
function dadNorm(s) {
  return String(s || "").toLowerCase().replace(/[\u2019\u2018]/g, "'").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
}
function dadStem(w) {
  w = w.replace(/'/g, "");
  if (w.length > 4 && w.slice(-3) === "ies") w = w.slice(0, -3) + "y";
  else if (w.length > 5 && w.slice(-3) === "ing") w = w.slice(0, -3);
  else if (w.length > 4 && w.slice(-2) === "ed") w = w.slice(0, -2);
  else if (w.length > 3 && w.slice(-1) === "s" && w.slice(-2) !== "ss") w = w.slice(0, -1);
  /* SPEC-DAD-QA1105-04 stem parity: a silent final e is spelling, not
     meaning. The forms a parent types must land on the stem the bank
     files: "bites"/"bite" and the filed topic "biting" all land on
     "bit", as "leaves" and the filed "leaving" land on "leav". The
     strip runs on bank words and query words alike (one stemmer feeds
     topics, titles, body text, and the query), so both sides of every
     comparison move together. */
  if (w.length > 3 && w.slice(-1) === "e" && w.slice(-2) !== "ee") w = w.slice(0, -1);
  return w;
}
function dadTokenPairs(s) {
  var out = [], seen = {};
  dadNorm(s).split(" ").forEach(function (w) {
    if (!w || DADIO_STOP[w]) return;
    var st = dadStem(w);
    if (st.length < 2 || seen[st]) return;
    seen[st] = 1; out.push({ raw: w.replace(/'/g, ""), stem: st });
  });
  return out;
}
function dadTokens(s) {
  return dadTokenPairs(s).map(function (p) { return p.stem; });
}
/* SPEC-DADIO-ASK-TIE-1 scoring: a query word earns its best single
   source, never a stack of them. A lesson's own topics (the words the
   bank itself files the lesson under) weigh most: a full topic match
   pays 4 per word, a word from a partly matched topic pays 3 (capped
   at 3 per lesson), a title word pays 2, and a word found only in the
   lesson text pays 1 (capped at 5). Each extra topic entry the words
   touch adds 1, up to 2, so a lesson filed under a word three ways
   beats one that merely mentions it. The no-match promise is kept by
   a plain-words gate, not a higher bar: a lesson only clears the bar
   when the match rests on more than one real word, on one full topic
   phrase, or on the query's only content word — so a single stray
   word ("tomorrow" in "weather tomorrow", "fix" in "fix my car")
   caps the score at 3, under the bar, while a one-word designed
   topic ("play") still answers. Setting and filler words (grocery,
   store, toddler, time, much, too) name the scene, not the hard
   part, so they never count for or against the gate. */
/* SPEC-DAD-COLDQA1106B-01 (Nov 7, 2026): ease and chaos words name
   how hard a moment feels, not the moment itself — "easier" / "easy" /
   "easily" in "make bedtime easier", "chaos" / "chaotic" in "morning
   routine is chaos". They sat in no lesson's topics, so a query whose
   only other words were one solid topic anchor ("bedtime", "morning",
   "bath") failed the gate on the strength of a modifier and capped at
   3, one under the bar — the site's own question-page titles dead-
   ended. As neutral words they still score (body/title/topic weight
   is unchanged); they simply never count for or against the gate,
   like the scene words below. Alone they serve nothing: "easier" or
   "chaos" by itself still finds no anchor and stays a no-match. */
/* SPEC-DAD-COLDQA1106B-02 (Nov 7, 2026): "simpler" / "simple" are the
   same ease family one word over — "make bedtime simpler for us",
   "how to make dinner simpler", and "make bath time simpler" capped
   at 3 exactly as the "easier" shapes did before the fix above,
   because the word sat in no lesson's topics and was not neutral, so
   it vetoed the single solid anchor ("bedtime", "dinner", "bath").
   The morning shapes already passed only because a routine/topic
   filing carried a second anchor. "simpler" / "simple" now join the
   neutral set and the feeling set below, the same class treatment
   "easier" received — no score weights change, the bar stays 4, and
   alone they still serve nothing: bare "simpler" / "simple" find no
   anchor and stay honest no-matches. */
/* SPEC-DAD-COLDQA1106B-04 (Nov 7, 2026): "please" is politeness
   filler, not a hard part, but it sat in no set at all, so it
   counted as a plain unmatched word everywhere. On its own it
   vetoed nothing ("please make bedtime simpler" served at 9) and
   one scene word on its own was excused by the feeling branch
   below ("make bedtime simpler at our house" served at 9) — but
   together, "please" plus "make" plus "house" are three unmatched
   words beside the one solid anchor ("bedtime"), one past that
   branch's two-word allowance, so "please make bedtime simpler
   at our house" capped at 3 while its "easier" twin served at
   14 on the full filed phrase "make bedtime easier". "please"
   now joins the neutral set, with the scene words: it appears in
   no lesson's topics, title, or text, so it earns no score; it
   simply never counts for or against the gate. No score weights
   change, the bar stays 4, and the honesty promise is unchanged:
   "please" beside a dose, car, weather, or bitcoin ask names no
   anchor and still serves nothing. */
/* SPEC-DAD-VERIFY1935-01 (Nov 7, 2026): the rest of the request
   frame is the same politeness class one ring further out. "help"
   (with "us" — "me" and "you" are stop words and never tokenize),
   "kindly", "pls", and "thanks" / "thank you" each sat outside the
   neutral set, so any one of them beside a "simpler" anchor plus
   a scene word was again the third unmatched word past the
   feeling branch's two-word allowance: "help me make bedtime
   simpler at our house", "kindly make bedtime simpler at our
   house", "thank you please make bedtime simpler at our house"
   all capped at 3 while their "easier" twins served on the full
   filed phrase. Each word was checked the way "please" was:
   "kindly" and "pls" appear in no lesson's topics, title, or
   text and earn no score anywhere; "help" earns score only as a
   filed topic of Lessons 10 and 16 (it was already a light verb,
   never a solid anchor) and in body text; "us" earns only one
   body word in Lesson 17; "thanks" earns only one body word in
   Lesson 10. None earns any score in the lessons these shapes
   anchor to, so as neutral words they simply never count for or
   against the gate; no score weights change and the bar stays 4.
   One honest consequence: bare "help" used to serve Lesson 10 on
   the word alone; it now names no situation and stays a
   no-match, like bare "easier". Beside a dose, car, weather, or
   bitcoin ask every one of these words names no anchor and
   still serves nothing. */
/* SPEC-DAD-VERIFY1945-01 (Nov 7, 2026): greeting and attention
   openers and the wider thanking frame are the same politeness
   class one ring further out again. "excuse" (the "excuse me"
   framing — "me" is a stop word and never tokenizes), "hey",
   "hi", "pardon", "yo", and the thanking expansions "lot" (in
   "thanks a lot"), "many" (in "many thanks"), "bunch" (in
   "thanks a bunch"), and "appreciated" (in "much appreciated"
   — "much" was already neutral) each sat outside the neutral
   set, so any one of them beside a "simpler" anchor plus a
   scene word was again the unmatched word past the feeling
   branch's allowance: "excuse me make bedtime simpler at our
   house", "hey make bedtime simpler at our house", "thanks a
   lot make bedtime simpler at our house" all capped at 3 while
   their "easier" twins served on the full filed phrase. Each
   word was checked the way "please" was: "excuse", "hey",
   "hi", "many", "pardon", "yo", "bunch", and "appreciated"
   appear in no lesson's topics, title, or text and earn no
   score anywhere; "lot" earns only body words in Lessons 17,
   20, and 27. None earns any score in the lessons these shapes
   anchor to, so as neutral words they simply never count for
   or against the gate; no score weights change and the bar
   stays 4. Two neighbours are deliberately NOT in this class:
   "sorry" and "hello" carry their own lesson anchors (the
   apology lesson and the greeting lesson), and "there" is a
   stop word that never tokenizes ("hey there" needs no
   filing). Beside a dose, car, weather, or bitcoin ask every
   one of these words names no anchor and still serves
   nothing. */
var DADIO_NEUTRAL = {};
("grocery store toddler time much too easier easy easily simpler simple chaos chaotic please help us kindly pls thanks excuse hey hi pardon yo lot many bunch appreciated").split(" ").forEach(function (w) { DADIO_NEUTRAL[dadStem(w)] = 1; });
var DADIO_LIGHT = {};
("get take make go come keep give let put try help want").split(" ").forEach(function (w) { DADIO_LIGHT[dadStem(w)] = 1; });
/* SPEC-DAD-VERIFY1894-02 (Nov 7, 2026): the ease/chaos words filed
   neutral by SPEC-DAD-COLDQA1106B-01, stemmed the same way. A query
   that carries one of these words is describing how a filed moment
   feels (chaos at dinner, a chaotic bedtime); the gate branch in
   dadScore below reads this set to tell that shape apart from a
   plain unmatched word with no feeling word at all.
   SPEC-DAD-COLDQA1106B-02 (Nov 7, 2026): "simpler" / "simple" join
   this set too — a "make X simpler" ask carries up to two plain
   unmatched words beside its anchor ("for us" in "make bedtime
   simpler for us"), and this branch is what keeps those plain words
   from vetoing the anchor, exactly as it already did for "easier". */
var DADIO_FEELING = {};
("easier easy easily simpler simple chaos chaotic").split(" ").forEach(function (w) { DADIO_FEELING[dadStem(w)] = 1; });
/* QA1105-04 stem parity: these sets are only ever looked up with
   STEMMED tokens, so their keys are filed through dadStem itself —
   after the silent-e strip, a raw "make"/"store"/"time" key would
   never meet its stemmed lookup ("mak"/"stor"/"tim") and the word
   would silently stop counting as light/neutral. */
/* SPEC-DADIO-ASK-FUZZ-1 tolerance: a dad typing one-handed misspells
   the hard-part word ("lisen", "bedtyme", "tantrm", "diner") or uses a
   plain word the bank does not ("screams" for crying, "nightmare" for
   a bedtime fight). Tolerance canonicalizes the QUERY's words before
   scoring — a small curated synonym map, plus a one-letter correction
   applied only when the typed word matches nothing in the bank at all
   and sits one edit from exactly one topic/title word (same first
   letter). It feeds the scorer above; the gate and the bar of 4 are
   unchanged, and a word that already matches anything is never
   rewritten, so an off-topic ask still earns an honest no-match. */
var DADIO_SYN = { scream: "cry", nightmar: "fight", nitemar: "fight", dawdl: "slow" };
/* QA1105-04: the map is looked up by stem, so its keys are stems —
   "nightmare" stems to "nightmar" under the silent-e strip. */
var DADIO_VOCAB = null;
function dadVocab() {
  if (DADIO_VOCAB) return DADIO_VOCAB;
  var tt = {}, all = {}, rawTT = [], rawSeen = {}, phraseSet = {}, phraseHeads = {};
  var addPhrase = function (s) {
    var seq = dadNorm(s).split(" ").filter(function (w) { return !!w && !DADIO_STOP[w]; }).map(function (w) { return dadStem(w); });
    if (seq.length) phraseSet[seq.join(" ")] = 1;
    if (seq.length > 1) phraseHeads[seq[seq.length - 1]] = 1;
  };
  (window.DADIO_LESSONS || []).forEach(function (lesson) {
    (lesson.topics || []).forEach(function (t) {
      dadTokens(t).forEach(function (w) { tt[w] = 1; all[w] = 1; });
      dadTokenPairs(t).forEach(function (p) { if (!rawSeen[p.raw]) { rawSeen[p.raw] = 1; rawTT.push(p); } });
      addPhrase(t);
    });
    dadTokens(lesson.title).forEach(function (w) { tt[w] = 1; all[w] = 1; });
    dadTokenPairs(lesson.title).forEach(function (p) { if (!rawSeen[p.raw]) { rawSeen[p.raw] = 1; rawTT.push(p); } });
    addPhrase(lesson.title);
    dadTokens(lesson.idea + " " + lesson.move + " " + lesson.play + " " + lesson.why + " " + lesson.core).forEach(function (w) { all[w] = 1; });
  });
  DADIO_VOCAB = { tt: Object.keys(tt), ttSet: tt, all: all, rawTT: rawTT, phraseSet: phraseSet, phraseHeads: phraseHeads };
  return DADIO_VOCAB;
}
function dadEdit1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  var d = [], i, j;
  for (i = 0; i <= a.length; i++) { d.push([i]); }
  for (j = 1; j <= b.length; j++) d[0].push(j);
  for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
    d[i].push(Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)));
  }
  return d[a.length][b.length] === 1;
}
/* SPEC-DADIO-ASK-STEM-1: the FUZZ-1 correction above compares the
   STEMMED typed word with the STEMMED bank, so a word one edit from
   the unstemmed bank word sits two edits from its stem and never
   corrects ("mornin" vs stem "morn", "shoutng" vs stem "shout").
   Two narrow additions, same fences (5+ letters, same first letter,
   exactly one hit): when the stemmed comparison finds nothing, the
   typed word's raw form is compared with the bank's unstemmed
   topic/title words and a unique hit is taken as that word's stem;
   and a base form whose silent-e drop is itself a topic/title stem
   is taken as that stem ("leave" -> "leav", the stem of the topic
   "leaving"). The raw comparison keeps the FUZZ-1 guard that a word
   matching anything in the bank is never rewritten, so a real bank
   word ("share") can never be hijacked to a neighbour ("shake");
   the e-drop check is the one exception, and it can only land on a
   stem the bank itself files a lesson under. */
function dadCanonPairs(pairs) {
  var vocab = dadVocab();
  return pairs.map(function (p) {
    var t = p.stem;
    var w = DADIO_SYN[t] || t;
    if (w !== t) return w;
    var corrected = null;
    if (t.length >= 5 && !vocab.all[t] && !DADIO_NEUTRAL[t]) {
      var hits = vocab.tt.filter(function (v) { return v.length >= 4 && v.charAt(0) === t.charAt(0) && dadEdit1(t, v); });
      if (hits.length === 1) corrected = hits[0];
      else if (hits.length === 0 && p.raw.length >= 5) {
        var stems = {}, list = [];
        vocab.rawTT.forEach(function (e) {
          if (e.raw.length >= 4 && e.raw.charAt(0) === p.raw.charAt(0) && dadEdit1(p.raw, e.raw) && !stems[e.stem]) { stems[e.stem] = 1; list.push(e.stem); }
        });
        if (list.length === 1) corrected = list[0];
      }
    }
    if (!corrected && t.length >= 5 && t.slice(-1) === "e" && !vocab.ttSet[t] && !DADIO_NEUTRAL[t]) {
      var variant = t.slice(0, -1);
      if (vocab.ttSet[variant]) corrected = variant;
    }
    return corrected || t;
  });
}
function dadCanon(pairs) {
  var out = [], seen = {};
  dadCanonPairs(pairs).forEach(function (w) { if (!seen[w]) { seen[w] = 1; out.push(w); } });
  return out;
}
/* SPEC-DADIO-COLDQA-COMP-02 (Nov 4, 2026): a child doing an action
   the bank files in verb forms — "my toddler hit her cousin at the
   park" — was capped as a no-match because the people and place words
   around the action match nothing, even though the action word itself
   is a full topic match (Lesson 35 files hit, hits, and hitting).
   This helper names that shape from the bank's own filing, not from
   the query's words: the query names a child, and one of its words —
   the visitor's own word, never a synonym swap or a spelling
   correction — fully matches a topic the lesson itself files in an
   -ing or -ed form as well (hitting, biting, pushing, kicking). The
   scene words around the action cannot veto that match. Noun topics
   (car, tomorrow) file no verb forms, so the designed stray-word caps
   ("weather tomorrow", "fix my car") are untouched. */
function dadActionHit(lesson, query, qPairs, qCorr, full) {
  var child = { toddler: 1, kid: 1, kids: 1, child: 1, children: 1, daughter: 1, son: 1, baby: 1, she: 1, he: 1, her: 1, him: 1, his: 1 };
  var hasChild = false;
  dadNorm(query).split(" ").forEach(function (w) { if (child[w]) hasChild = true; });
  if (!hasChild) return false;
  var collapse = function (w) {
    return (w.length >= 3 && w.charAt(w.length - 1) === w.charAt(w.length - 2) && "aeiou".indexOf(w.charAt(w.length - 1)) < 0) ? w.slice(0, -1) : w;
  };
  var verbStems = {};
  (lesson.topics || []).forEach(function (t) {
    dadNorm(t).split(" ").forEach(function (w) {
      if (/(ing|ed)$/.test(w)) verbStems[collapse(dadStem(w))] = 1;
    });
  });
  var rawWords = dadNorm(query).split(" ");
  for (var i = 0; i < qPairs.length; i++) {
    if (qCorr[i] !== qPairs[i].stem) continue;
    if (full[qCorr[i]] && verbStems[collapse(qCorr[i])]) return true;
    /* SPEC-DAD-VERIFY1583-03: an -en participle a parent types in a
       sentence ("my son has bitten two kids") stems to itself, not to
       the verb stem the bank files ("biting" -> "bit"), so the action
       hit above missed it and the sentence diluted under the bar
       while plain "bit" served. The participle base (drop -en, then
       undouble: bitten -> bitt -> bit) earns the same action hit —
       but only in an actor frame. A victim frame (a passive helper
       just before the word: was / were / got / getting / been …, or
       "by" right after it) earns nothing: "he keeps getting bitten
       by another kid" and "my daughter was bitten by a kid" stay
       plain no-matches, as filed. */
    if (full[qCorr[i]] && qCorr[i].length >= 5 && qCorr[i].slice(-2) === "en") {
      var enBase = collapse(qCorr[i].slice(0, -2));
      if (verbStems[enBase]) {
        var wi = rawWords.indexOf(qPairs[i].raw);
        var passive = false;
        if (wi >= 0) {
          var aux = { was: 1, were: 1, is: 1, are: 1, got: 1, gets: 1, get: 1, getting: 1, been: 1, being: 1 };
          rawWords.slice(Math.max(0, wi - 2), wi).forEach(function (w) { if (aux[w]) passive = true; });
          if (rawWords[wi + 1] === "by") passive = true;
        }
        if (!passive) return true;
      }
    }
  }
  return false;
}
/* SPEC-DAD-VERIFY1583-01: the repair frame. A query that names a
   non-child repair object (an appliance, a vehicle, a device, or a
   household object) in a fixing frame (fix / repair / broken / broke
   / cracked / leaking …) is a home-repair situation, not a parenting
   one — yet the broken+"fix it" stack scored Lesson 41 at a flat 9
   for every named object, and a black TV/phone "screen" escaped
   through the parenting topic noun "screen" (Lessons 36/26). The
   score cannot see the noun, so this gate can: when a named repair
   object and a fixing frame are both present, the match must rest
   on a parenting situation anchor — a child subject (she / he /
   daughter / son / kid / toddler / boy / girl …) or amends words
   (sorry / apologize / amends / hurt) — the same anchors the
   in-domain controls carry ("she broke the toy how does she fix
   it", "he hurt a friend how can he fix it"). With no anchor, no
   lesson passes the gate on these words alone. Deliberate decision
   on the bare shape: "it is broken how do I fix it" names no object,
   so this gate does not fire and it keeps serving Lesson 41 — the
   bare wording is ambiguous (a child's broken thing, a wrong to
   mend) and is Lesson 41's home ground, as the SPEC scopes it.
   A child's own things (a toy) are not repair objects here.
   SPEC-DAD-VERIFY1593-01 (Nov 5, 2026): the object list below is a
   CLOSED list, and unlisted appliances of exactly the same kind
   (blender, kettle, vacuum, coffee maker, air conditioner, water
   heater) sailed through it at the same pre-fix scores. Extending
   the list would only move the hole, so the class is now closed
   STRUCTURALLY, by sentence shape, with the list kept unchanged as
   one signal among two: a named object is a determiner-led noun
   phrase (the / my / a / an / this / that / our / your plus up to
   three content words, a frame adjective like "broken" skipped)
   sitting in an object or subject slot — right before a copula
   (is / are / was / were: "the blender is broken"), right before
   a frame word ("the lamp broke"), or right after a fix / repair /
   mend verb ("fix my broken vacuum cleaner", "how do I fix a
   broken blender"). Any noun at all can fill that slot, listed or
   not, so the class closes for objects nobody has typed yet. The
   bare-shape decision above is preserved by the same shape: in
   "it is broken how do I fix it" the only candidate word is the
   pronoun "it", which never starts a determiner phrase, so no
   object is named and the gate still does not fire. One carve-out,
   read from the bank itself: a phrase whose words the bank files
   as a lesson topic or title (bedtime, tantrum, routine, toy …)
   names a parenting situation, not a household object, so it
   never counts structurally — "how do I fix the bedtime routine"
   keeps serving the bedtime lesson, and a child's own things stay
   out of the gate, as the original note above required.
   SPEC-DAD-VERIFY1605-01 (Nov 5, 2026): the carve-out above was
   WORD-level — one shared stem anywhere in the phrase marked the
   whole phrase as domain, so a phrase that merely CONTAINS a bank
   stem escaped: stem "gam" is filed only by Lesson 39's title word
   "Game" and stem "light" only by Lesson 32's two-word topic
   "night light", yet "the gaming console", "the porch light" and
   "the light" all sailed through to Lesson 41. The carve-out is
   now PHRASE-level, read from the bank's filed phrases
   (dadVocab().phraseSet — every topic and title as a stem
   sequence): a phrase counts as domain only when the phrase AS A
   WHOLE is a filed phrase, or is a compound whose every word the
   bank files ("sleep routine", "morning routine"), or begins with
   a filed multi-word phrase ("bedtime routine" plus a trailing
   word). A lone word counts only when the bank files it as a
   one-word topic ("tantrum", "toy" via "toys", "routine").
   Deliberate call on "night light": it IS a filed two-word topic
   read as a phrase, so "the night light is broken" stays carved
   out and keeps serving Lesson 32 — while "light" alone, "porch
   light", "garden lights", "light bulb" and "ceiling light" name
   no filed phrase and now count as the household objects they are.
   SPEC-DAD-VERIFY1605-02 (Nov 5, 2026): the slot windows also
   widened as classes. The phrase window now runs to the
   copula/frame word (bounded at eight content words) instead of
   stopping at three, so "the big red waffle iron" counts in the
   subject slot just as it already did after a fix verb. A relative
   pronoun (that / which / who / whom) between the phrase and the
   copula no longer breaks the subject slot — the clause is skipped
   to the copula or frame word that ends it ("the waffle iron that
   I bought is broken"). Phrasal particles (up / off / out) may sit
   between a fix verb and its phrase ("fix up my broken rice
   cooker"). And the subject slot is determiner-optional: a content
   phrase sitting directly before a copula or frame word counts
   with no determiner at all ("blender is broken", "waffle iron
   broke") — the walk back stops at stop words, copulas, frame and
   fix verbs, and at a determiner (the determiner-led pass above
   owns those), so the bare shape still names no object: in "it is
   broken how do I fix it" the walk back from "is" meets the
   pronoun "it", a stop word, and stops empty.
   SPEC-DAD-VERIFY1608-01 (Nov 5, 2026): the phrase-level carve-out
   above still leaked through its two widening clauses. The compound
   clause trusted any phrase whose every word's stem appears
   ANYWHERE in the bank's topic/title words, so two unrelated
   filings combined into a fake domain phrase: stem "light" (filed
   only inside Lesson 32's two-word topic "night light") plus stem
   "switch" (Lesson 3's transitions topic) carved out "the light
   switch", and "the morning light" / "the light game" escaped the
   same way. The begins-with clause carved out any phrase that
   merely STARTS with a filed phrase: "the night light bulb",
   "the bedtime routine lamp", "the night light switch". Both
   clauses are now closed as classes. The compound clause fires
   only when every word of the phrase is ITSELF a filed one-word
   phrase (each word alone names a bank situation, as "sleep" and
   "routine" each do for "sleep routine" / "morning routine") AND
   the phrase's head word closes a filed multi-word phrase, as
   "routine" closes "bedtime routine" — a word that appears only
   inside a longer filed phrase ("light" inside "night light",
   "game" inside a title) no longer counts, and a stray pairing
   of two filed words ("sleep switch") names no bank situation
   either, because "switch" closes no filed phrase.
   The begins-with clause is removed outright: phrase extraction
   already stops at stop words, copulas and frame words, so every
   trailing word that can reach the clause is a content word, and
   a content word after a filed phrase names a different, longer
   object that is filed nowhere. The whole-phrase core is
   unchanged: "the night light is broken" is a filed two-word
   topic read as a phrase and keeps serving Lesson 32, and
   "bedtime routine" keeps serving Lesson 6 in every shape.
   SPEC-DAD-VERIFY1608-02 (Nov 5, 2026): three more slot shapes
   widened as classes. (1) The relative-clause skip no longer dies
   on a determiner inside the clause — a determiner can belong to
   the clause's own subject ("the waffle iron that my wife gave
   me is broken") or to a phrase inside the clause ("...that I
   keep by the toy is broken") — and the skip window widens; and
   an anchor word inside such a clause names the clause's giver,
   not the repair's actor, so it no longer vetoes the gate (a
   main-clause anchor still does). (2) The present perfect
   completes the subject slot like a copula: "has / have" (or
   "has been") directly before a frame word ends the phrase
   ("the blender has broken"). (3) A time adverb may sit between
   a fix verb and its phrase, like a particle ("fix tomorrow my
   broken rice cooker", "fix in the morning my broken waffle
   iron"), and the governed look-back widens from four words to
   six so a full time phrase fits in the gap. */
function dadRepairNoAnchor(query) {
  var rawWords = dadNorm(query).split(" ").filter(function (w) { return !!w; });
  var words = {};
  rawWords.forEach(function (w) { words[w] = 1; words[w.replace(/'s$/, "")] = 1; });
  var objects = ["washing", "machine", "washer", "dishwasher", "dryer", "fridge", "refrigerator", "freezer", "oven", "stove", "microwave", "toilet", "sink", "faucet", "pipe", "pipes", "car", "truck", "motorcycle", "motorbike", "bike", "bicycle", "van", "engine", "tire", "tyre", "battery", "laptop", "computer", "phone", "phones", "tv", "television", "screen", "tablet", "ipad", "printer", "router", "wifi", "fence", "gate", "chair", "table", "door", "handle", "glasses", "spectacles", "window", "windows", "garage", "lawnmower", "mower", "lock"];
  var frame = ["fix", "fixes", "fixing", "fixed", "repair", "repairs", "repairing", "repaired", "broken", "broke", "cracked", "crack", "mend", "mending", "leak", "leaks", "leaking", "jammed", "stuck"];
  var anchors = ["she", "he", "her", "him", "his", "daughter", "son", "kid", "kids", "child", "children", "toddler", "baby", "boy", "girl", "friend", "friends", "sister", "brother", "sorry", "apologize", "apologise", "apologized", "amends", "hurt", "hurts", "hurting"];
  var has = function (arr) { return arr.some(function (w) { return words[w]; }); };
  if (!has(frame)) return false;
  /* VERIFY1608-02: an anchor word inside a relative clause that
     hangs off the named object names the clause's giver, not the
     repair's actor ("the waffle iron that my brother gave me is
     broken" must not be vetoed by "brother"). Mark each relative
     clause span — a relative pronoun after a content word, up to
     the copula / frame / perfect word that closes the clause —
     and count an anchor only when some use of it sits outside
     every span. A main-clause anchor ("she broke the gaming
     console") still vetoes, exactly as before. */
  var relPron = { that: 1, which: 1, who: 1, whom: 1 };
  var frameSetA = {}; frame.forEach(function (w) { frameSetA[w] = 1; });
  var clauseEnd = { is: 1, are: 1, was: 1, were: 1, has: 1, have: 1 };
  var inRel = {};
  for (var ri = 1; ri < rawWords.length; ri++) {
    if (!relPron[rawWords[ri]] || DADIO_STOP[rawWords[ri - 1]]) continue;
    for (var rj = ri + 1; rj < rawWords.length && rj < ri + 17; rj++) {
      inRel[rj] = 1;
      if (clauseEnd[rawWords[rj]] || frameSetA[rawWords[rj]]) break;
    }
  }
  var anchorSet = {}; anchors.forEach(function (w) { anchorSet[w] = 1; });
  var hasAnchor = false;
  rawWords.forEach(function (w, idx) {
    if (inRel[idx]) return;
    if (anchorSet[w] || anchorSet[w.replace(/'s$/, "")]) hasAnchor = true;
  });
  if (hasAnchor) return false;
  if (has(objects)) return true;
  var det = { the: 1, my: 1, a: 1, an: 1, this: 1, that: 1, our: 1, your: 1 };
  var copula = { is: 1, are: 1, was: 1, were: 1 };
  var frameSet = {}; frame.forEach(function (w) { frameSet[w] = 1; });
  var fixVerb = { fix: 1, fixes: 1, fixing: 1, repair: 1, repairs: 1, repairing: 1, mend: 1, mending: 1 };
  var adjSkip = { broken: 1, cracked: 1, jammed: 1, stuck: 1, leaking: 1, leaky: 1 };
  var rel = { that: 1, which: 1, who: 1, whom: 1 };
  var particle = { up: 1, off: 1, out: 1 };
  /* VERIFY1608-02: time adverbs tolerated in the governed gap
     between a fix verb and its phrase, like particles. */
  var timeGap = { tomorrow: 1, yesterday: 1, tonight: 1, today: 1, morning: 1, afternoon: 1, evening: 1, night: 1, later: 1, soon: 1 };
  var vocab = dadVocab();
  var ttSet = vocab.ttSet;
  /* VERIFY1608-02: the present perfect completes a subject slot
     like a copula — "has / have" (or "has been") directly before
     a frame word ends the phrase ("the blender has broken"). */
  var hasAux = { has: 1, have: 1 };
  var perfectSlot = function (idx) {
    if (!hasAux[rawWords[idx]]) return false;
    var nx = rawWords[idx + 1];
    if (nx && frameSet[nx]) return true;
    return nx === "been" && !!rawWords[idx + 2] && !!frameSet[rawWords[idx + 2]];
  };
  /* VERIFY1605-01 carve-out, VERIFY1608-01 grain completion: a
     phrase counts as domain when the phrase AS A WHOLE is filed,
     or when it is an assembled compound whose every word is
     itself a filed one-word phrase AND whose head (last) word
     closes a filed multi-word phrase ("sleep routine", "morning
     routine" — each word alone names a bank situation, and
     "routine" closes "bedtime routine"). A word that merely
     appears inside a longer filed phrase or title ("light" in
     "night light", "game" in a title) does not count, and a
     filed phrase plus a trailing content word ("night light
     bulb") is a longer phrase that is filed nowhere, so no
     begins-with clause remains. */
  var domainPhrase = function (stems) {
    if (!stems.length) return false;
    if (vocab.phraseSet[stems.join(" ")]) return true;
    if (stems.length < 2) return false;
    var everyWordFiledAlone = true;
    stems.forEach(function (st) { if (!vocab.phraseSet[st]) everyWordFiledAlone = false; });
    return everyWordFiledAlone && !!vocab.phraseHeads[stems[stems.length - 1]];
  };
  /* The subject slot after a phrase ending at index j: a copula,
     frame word or present perfect right there, or a relative
     clause first (VERIFY1605-02, widened by VERIFY1608-02: the
     skip no longer dies on a determiner inside the clause — one
     can belong to the clause's own subject, "that my wife gave
     me", or to a phrase inside the clause, "that I keep by the
     toy" — and the window runs to sixteen words). */
  var slotAfter = function (j) {
    var after = rawWords[j];
    if (after && (copula[after] || frameSet[after])) return true;
    if (after && perfectSlot(j)) return true;
    if (after && rel[after]) {
      for (var r = j + 1; r < rawWords.length && r < j + 17; r++) {
        var rw = rawWords[r];
        if (copula[rw] || frameSet[rw] || perfectSlot(r)) return true;
        if (fixVerb[rw] || rel[rw]) break;
      }
    }
    return false;
  };
  for (var i = 0; i < rawWords.length; i++) {
    if (!det[rawWords[i]]) continue;
    var phrase = [], stems = [], j = i + 1;
    while (j < rawWords.length && phrase.length < 8) {
      var w = rawWords[j];
      if (!phrase.length && adjSkip[w]) { j++; continue; }
      if (DADIO_STOP[w] || copula[w] || frameSet[w] || w === "it") break;
      phrase.push(w); stems.push(dadStem(w)); j++;
    }
    if (!phrase.length || domainPhrase(stems)) continue;
    if (slotAfter(j)) return true;
    for (var k = Math.max(0, i - 6); k < i; k++) {
      if (!fixVerb[rawWords[k]]) continue;
      var governed = true;
      for (var m = k + 1; m < i; m++) { if (!DADIO_STOP[rawWords[m]] && !adjSkip[rawWords[m]] && !particle[rawWords[m]] && !timeGap[rawWords[m]]) governed = false; }
      if (governed) return true;
    }
  }
  /* VERIFY1605-02: the determiner-optional subject slot — a content
     phrase directly before a copula or frame word, no determiner. */
  for (var c = 0; c < rawWords.length; c++) {
    if (!copula[rawWords[c]] && !frameSet[rawWords[c]] && !perfectSlot(c)) continue;
    var bPhrase = [], bStems = [], blocked = false;
    for (var b = c - 1; b >= 0 && bPhrase.length < 8; b--) {
      var bw = rawWords[b];
      if (!bPhrase.length && adjSkip[bw]) continue;
      if (DADIO_STOP[bw] || copula[bw] || frameSet[bw] || fixVerb[bw] || bw === "it") break;
      if (det[bw]) { blocked = true; break; }
      bPhrase.unshift(bw); bStems.unshift(dadStem(bw));
    }
    if (blocked || !bPhrase.length || domainPhrase(bStems)) continue;
    return true;
  }
  return false;
}
/* SPEC-DAD-VERIFY1894-01 (Nov 7, 2026): the dose-seeking shape.
   "How much medicine should I give her" and "what dose of ibuprofen
   should I give my child" served Lesson 27 ("Make a Gift for
   Someone") at exactly the bar: "give" stems to "giv", which fully
   matches the gift lesson's filed topic "giving", and the child word
   carried it through the action-hit gate. No written lesson answers
   a dose question — the chat worker declines these on its medical
   route — so the on-device matcher must answer its honest no-match,
   the way the filed dose control already behaves. The shape is read
   structurally, not by filed strings: a dose cue (a dose word, a
   dose unit, or a how-much / how-many quantity ask) together with a
   medicine word (a generic medicine word or a common named one),
   or "give" beside a dose word or unit, or "give" in a quantity ask
   whose object is a word the bank files nowhere (a named medicine
   is exactly that: ibuprofen and tylenol appear in no lesson's
   topics, title, or text). A quantity ask with no medicine, no
   "give", and no unknown object — "how many lessons are there" —
   is untouched, as is every serving query: no filed query carries
   this shape. When the shape fires, no lesson passes the gate. */
function dadDoseAsk(query) {
  var rawWords = dadNorm(query).split(" ").filter(function (w) { return !!w; });
  var words = {};
  rawWords.forEach(function (w) { words[w] = 1; });
  var has = function (arr) { return arr.some(function (w) { return words[w]; }); };
  var doseWord = has(["dose", "doses", "dosage", "dosing"]);
  var unitWord = has(["milligram", "milligrams", "mg", "milliliter", "milliliters", "millilitre", "millilitres", "ml", "teaspoon", "teaspoons", "tsp", "tablespoon", "tablespoons", "tbsp", "cc"]);
  var medWord = has(["medicine", "medicines", "medication", "medications", "drug", "drugs", "ibuprofen", "tylenol", "acetaminophen", "paracetamol", "advil", "motrin", "benadryl", "diphenhydramine", "cetirizine", "zyrtec", "claritin", "loratadine", "amoxicillin"]);
  var giveWord = has(["give", "gives", "giving", "gave", "given"]);
  var nq = " " + dadNorm(query) + " ";
  var quantity = nq.indexOf(" how much ") >= 0 || nq.indexOf(" how many ") >= 0;
  if (!doseWord && !unitWord && !quantity) return false;
  if (medWord) return true;
  if (giveWord && (doseWord || unitWord)) return true;
  var vocab = dadVocab();
  var unknown = dadTokens(query).some(function (t) { return !vocab.all[t] && !DADIO_NEUTRAL[t] && !DADIO_LIGHT[t]; });
  if (giveWord && quantity && unknown) return true;
  if (unitWord && unknown) return true;
  return false;
}
function dadScore(lesson, query) {
  var qn = " " + dadNorm(query) + " ";
  var qPairs = dadTokenPairs(query);
  var qCorr = dadCanonPairs(qPairs);
  var qToks = [], qSeen = {};
  qCorr.forEach(function (t) { if (!qSeen[t]) { qSeen[t] = 1; qToks.push(t); } });
  var qSet = {}; qToks.forEach(function (t) { qSet[t] = 1; });
  var qSquash = qn.replace(/ /g, "");
  /* STEM-1: a second squash with each corrected word swapped for its
     correction, so a corrected one-word spelling of a two-word topic
     ("meltown" -> "meltdown", the topic "melt down" squashed) passes
     the same surface-phrase check the correct spelling passes. Only
     words the canon actually corrected are swapped; all other words
     stand as typed, in place. */
  var qCorrByStem = {};
  qPairs.forEach(function (p, i) { qCorrByStem[p.stem] = qCorr[i]; });
  var qCanonSquash = dadNorm(query).split(" ").map(function (w) {
    var raw = w.replace(/'/g, "");
    if (!w || DADIO_STOP[w]) return raw;
    var st = dadStem(w);
    var c = qCorrByStem[st];
    return (c && c !== st) ? c : raw;
  }).join("");
  var titleSet = {};
  dadTokens(lesson.title).forEach(function (t) { titleSet[t] = 1; });
  var bodySet = {};
  dadTokens(lesson.idea + " " + lesson.move + " " + lesson.play + " " + lesson.why + " " + lesson.core).forEach(function (t) { bodySet[t] = 1; });
  var full = {}, partial = {};
  var entriesHit = 0, phraseFull = false, surfacePhrase = false;
  (lesson.topics || []).forEach(function (topic) {
    var tn = dadNorm(topic);
    if (tn.indexOf(" ") >= 0) {
      var tSquash = tn.replace(/ /g, "");
      var tCanonSquash = tn.replace(/'/g, "").replace(/ /g, "");
      if (qn.indexOf(" " + tn + " ") >= 0 || (tSquash.length >= 6 && qSquash.indexOf(tSquash) >= 0) || (tCanonSquash.length >= 6 && qCanonSquash.indexOf(tCanonSquash) >= 0)) surfacePhrase = true;
    }
    var tt = dadTokens(topic);
    if (!tt.length) return;
    var matched = tt.filter(function (t) { return qSet[t]; });
    if (matched.length === tt.length) {
      matched.forEach(function (t) { full[t] = 1; });
      entriesHit += 1;
      if (tt.length >= 2) phraseFull = true;
    } else if (matched.length) {
      matched.forEach(function (t) { partial[t] = 1; });
      entriesHit += 1;
    }
  });
  var fullSum = 0, titleSum = 0, partialSum = 0, bodySum = 0;
  var np = {}, fullNP = {};
  qToks.forEach(function (t) {
    if (!DADIO_NEUTRAL[t]) {
      if (full[t] || titleSet[t] || bodySet[t]) np[t] = 1;
      if (full[t]) fullNP[t] = 1;
    }
    if (full[t]) fullSum += 4;
    else if (partial[t]) partialSum += 3;
    else if (titleSet[t]) titleSum += 2;
    else if (bodySet[t]) bodySum += 1;
  });
  if (partialSum > 3) partialSum = 3;
  if (bodySum > 5) bodySum = 5;
  var score = fullSum + titleSum + partialSum + bodySum + Math.min(Math.max(entriesHit - 1, 0), 2);
  var denomToks = qToks.filter(function (t) { return !DADIO_NEUTRAL[t]; });
  var npCount = Object.keys(np).length, fullNPCount = Object.keys(fullNP).length;
  var unmatched = denomToks.filter(function (t) { return !np[t]; });
  /* SPEC-DAD-QA1105-03: the two-word gate must rest on the parenting
     situation, not on a generic action verb or an incidental scene
     word. "Fix my car it makes a rattling noise" cleared the old gate
     twice over: Lesson 41 on the generic verb "fix" (its topic "fix
     it") plus the title word "make", and Lesson 45 on the setting
     noun "car" plus that same incidental "make". That is the
     designed stray-word shape one level up, so it takes the same
     cap: the full-topic anchor must be a situation word (not a light
     verb, not "fix"), and the corroborating word must be a topic
     word or a non-generic content word. Completion (same day): the
     phrase branch below takes the same anchor requirement — an
     adjacent generic phrase is still generic. "My laptop screen is
     cracked how do I fix it" carries the topic "fix it" word-for-word
     at the end, so the surface-phrase branch waved Lesson 41 through
     at the bar while the split-wording car query was capped. A phrase
     hit whose only full-topic anchor is a light verb or "fix" is not
     a parenting situation and does not pass on the phrase alone. */
  var topicNPCount = 0, topicSeen = {};
  Object.keys(full).concat(Object.keys(partial)).forEach(function (t) { if (!DADIO_NEUTRAL[t] && !topicSeen[t]) { topicSeen[t] = 1; topicNPCount += 1; } });
  var solidAnchor = Object.keys(fullNP).some(function (t) { return !DADIO_LIGHT[t] && t !== "fix"; });
  var npNonGeneric = denomToks.filter(function (t) { return np[t] && !DADIO_LIGHT[t] && t !== "fix"; }).length;
  var pass = false;
  if ((phraseFull || surfacePhrase) && solidAnchor) pass = true;
  else if (denomToks.length === 1 && fullNPCount === 1) pass = true;
  else if (npCount >= 2 && fullNPCount >= 1 && solidAnchor && (topicNPCount >= 2 || npNonGeneric >= 2)) pass = true;
  else if (npCount >= 3 && denomToks.some(function (t) { return partial[t]; })) pass = true;
  else if (denomToks.length > 0 && unmatched.length === 0 && npCount >= 1) pass = true;
  else if (unmatched.length === 1 && DADIO_LIGHT[unmatched[0]] && fullNPCount >= 1) pass = true;
  else if (fullNPCount >= 1 && dadActionHit(lesson, query, qPairs, qCorr, full)) pass = true;
  /* SPEC-DAD-VERIFY1894-02 (Nov 7, 2026): the one-anchor feeling
     shape. "Dinner is chaos" served Lesson 29, but "dinner is total
     chaos" capped at 3 — the intensifier "total" is a plain unmatched
     word and vetoed the single solid anchor, the same dilution the
     bedtime compounds showed ("bedtime is chaotic at our house",
     top Lesson 6 at 3, the scene word "house" unmatched). When the
     query carries an ease/chaos feeling word and the match rests on
     a solid full-topic anchor, up to two plain unmatched words (an
     intensifier, a scene word, a mess) no longer veto it. The fences
     keep the honesty promise: no anchor, no pass (gibberish, car,
     weather, and bitcoin beside "chaos" still match nothing); no
     feeling word, no pass ("my toddler screams at bedtime" and "our
     mornings are a mess" keep their honest no-match — neither names
     ease or chaos); bare "easier" / "chaos" alone still find no
     anchor and serve nothing. One more fence: an unmatched word
     that is itself a filed one-word topic ("mess", the tidy
     lesson's own anchor) is a competing anchor, not a plain word —
     it is tolerated only when this lesson's own score is already
     strong (5 or more), so "bedtime is a chaotic mess" serves the
     bedtime lesson (raw 6) while "dinner is a chaotic mess" stays
     an honest no-match instead of tipping to the tidy lesson on a
     tie. The bar itself is unchanged. */
  else if (fullNPCount >= 1 && solidAnchor && unmatched.length >= 1 && unmatched.length <= 2 && qToks.some(function (t) { return DADIO_FEELING[t]; }) && (score >= 5 || unmatched.every(function (t) { return !dadVocab().phraseSet[t]; }))) pass = true;
  /* SPEC-DAD-VERIFY1583-01: a named non-child repair object in a
     fixing frame, with no parenting situation anchor, passes no
     gate — the plain-words cap below then tells the truth. */
  if (dadRepairNoAnchor(query)) pass = false;
  /* SPEC-DAD-VERIFY1894-01: a dose-seeking shape (dadDoseAsk above)
     passes no gate either — the plain-words cap below then tells
     the truth and the matcher answers its honest no-match. */
  if (dadDoseAsk(query)) pass = false;
  if (!pass && score > 3) score = 3;
  return score;
}
/* SPEC-COLDQA1103-D2 route, rebuilt by SPEC-DAD-QA1105-01: a
   "today" ask — "what is today's lesson", the site's own headline
   question "what can I do with my 3-year-old today?", and their
   plain variants — names no hard part, so the topic scorer finds
   nothing and both ask doors dead-ended on it. The old route then
   invented an answer: a hard-coded pair (Lessons 22 + 6) served as
   "today's lesson" on every date. This route now resolves the
   day's REAL lesson from the same source the homepage card uses:
   the dated week map for the visitor's local date when it covers
   that date (the map below mirrors the homepage's DADIO_WEEK,
   and the homepage's own map wins when it is present), else the
   same steady daily rotation the homepage fallback uses. No
   hard-coded lesson pair stands in for a date. The route fires
   only for the today family (a lesson ask, or today plus an ask
   word plus a child word, or an ideas/things ask with a child
   word) and only when the query names no hard part — a named
   hard part keeps its own lesson or its honest no-match. */
var DADIO_WEEK_MAP = { "2026-11-01": 3, "2026-11-02": 27, "2026-11-03": 27, "2026-11-04": 21, "2026-11-05": 31, "2026-11-06": 2, "2026-11-07": 25, "2026-11-08": 25, "2026-11-09": 12 };
function dadTodayLesson() {
  var bank = window.DADIO_LESSONS || [];
  if (!bank.length) return null;
  var now = new Date();
  function key(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  var n = null;
  var wk = window.DADIO_WEEK || null;
  if (wk && wk[key(now)] && wk[key(now)].n) n = wk[key(now)].n;
  if (n === null && DADIO_WEEK_MAP[key(now)]) n = DADIO_WEEK_MAP[key(now)];
  if (n === null) {
    var doy = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    n = ((doy - 1) % bank.length) + 1;
  }
  for (var i = 0; i < bank.length; i++) { if (bank[i].n === n) return bank[i]; }
  return bank[0];
}
function dadTodayAsk(query) {
  var words = {};
  dadNorm(query).split(" ").forEach(function (w) { if (!w) return; words[w] = 1; words[w.replace(/'s$/, "")] = 1; });
  if (!words.today) return false;
  var hard = ["bedtime", "sleep", "sleeping", "listen", "listening", "tantrum", "meltdown", "cry", "crying", "scream", "screaming", "hit", "hits", "hitting", "bite", "biting", "yell", "yelling", "fight", "fights", "eat", "eating", "food", "dinner", "teeth", "potty", "sick", "fever"];
  for (var i = 0; i < hard.length; i++) { if (words[hard[i]]) return false; }
  if (words.lesson || words.lessons) return true;
  var askWord = words.what || words.things || words.thing || words.ideas || words.idea || words.activities || words.activity || words.something;
  var listWord = words.things || words.thing || words.ideas || words.idea || words.activities || words.activity;
  /* SPEC-DAD-VERIFY1583-02: boy / girl and their plurals are child
     words too — the two plainest words a dad types for his own kid
     were missing from this set, so "what can I do with my little boy
     today" dead-ended while the daughter twin served the day's
     lesson. Compounds ("baby girl", "little boy") arrive as separate
     words, so the plain forms carry them. The hard-part guard above
     is untouched. */
  var childWord = words.year || words.old || words.toddler || words.kid || words.kids || words.child || words.children || words.daughter || words.son || words.baby || words.boy || words.boys || words.girl || words.girls || words.we || words["2"] || words["3"] || words["4"] || words["5"];
  if (words.do && askWord && childWord) return true;
  if (listWord && childWord) return true;
  return false;
}
/* SPEC-COLDQA1103-D3 route: a bank-size question — "how many lessons
   are there?" and its plain variants — names no hard part, so the
   topic scorer finds nothing and the chat door fell through to a
   model-drafted welcome that sometimes carried the count and
   sometimes did not. This gate names the count family only (how
   many + lesson, in a total form: at the start of the ask, or with
   an are-there / do-you-have form), and refuses any ask that names
   a topic or hard part — those keep their own lesson or their
   honest no-match. The doors answer with the bank's own size,
   never a typed-in number. */
function dadCountAsk(query) {
  var words = {};
  dadNorm(query).split(" ").forEach(function (w) { if (w) words[w] = 1; });
  if (!words.how || !words.many) return false;
  if (!words.lesson && !words.lessons) return false;
  var topic = ["bedtime", "sleep", "sleeping", "listen", "listening", "tantrum", "meltdown", "cry", "crying", "scream", "screaming", "hit", "hits", "hitting", "bite", "biting", "yell", "yelling", "fight", "fights", "eat", "eating", "food", "dinner", "teeth", "potty", "sick", "fever", "play", "morning", "mornings", "feeling", "feelings"];
  for (var i = 0; i < topic.length; i++) { if (words[topic[i]]) return false; }
  var n = dadNorm(query);
  if (n.indexOf("how many") === 0) return true;
  if (words.are && words.there) return true;
  if (words.do && words.you && words.have) return true;
  return false;
}
/* Run-off / street-safety class (SPEC-DAD-COLDQA1105-01, Nov 5,
   2026): the on-device mirror of the chat worker's safety route.
   No written lesson covers running off, bolting, or staying safe
   near cars, streets, or parking lots, and the word "hand" in a
   hand-holding sentence used to pull the hitting lesson to the
   top as if it were the answer. The class, not one phrasing: a
   danger place with run-off motion or a hand-holding struggle, a
   hand-holding escape with run-off motion, or a bolt/dart verb
   aimed at a child outside a play frame. Hand-holding alone and
   run-off verbs alone never fire, and a hitting ask with no
   danger place keeps the hitting lesson. */
function dadRunOffSafety(query) {
  var t = String(query || "");
  var place = /\b(parking lot|parking|street|streets|road|roads|traffic|driveway|crosswalk|car park)\b/i.test(t);
  var runOff = /\b(bolt(?:s|ed|ing)?|dart(?:s|ed|ing)?|dash(?:es|ed|ing)?|runs? (?:off|away|out)|ran (?:off|away|out)|running (?:off|away|out)|takes? off|took off|gets? away|pulls? away|into (?:the )?(?:street|road|traffic)|across (?:the )?(?:parking lot|street|road))\b/i.test(t);
  var anyRun = /\b(run|runs|ran|running|race|races|racing|chase|chasing|escape|escapes|escaped|wander\w*)\b/i.test(t);
  var handHold = /\b(hold(?:s|ing)? (?:my|her|his) hands?|held my hand|holding hands|hand[- ]holding|lets? go of (?:my |her |his )?hand|let go of (?:my |her |his )?hand|rips? (?:out )?(?:her |his )?hand|pull(?:s|ed|ing)? (?:her |his )?hand (?:out|free|away)|won['’]?t hold (?:my |her |his )?hand|refuses? to hold (?:my |her |his )?hand)\b/i.test(t)
    || (/\bhands?\b/i.test(t) && (runOff || place));
  var crossing = /\bcross(?:ing|es|ed)? (?:the )?(?:road|street)\b/i.test(t) || /\bcrosswalk\b/i.test(t);
  if (place && (runOff || anyRun || handHold)) return true;
  if (crossing && handHold) return true;
  if (handHold && runOff) return true;
  if (/\b(bolt(?:s|ed|ing)?|dart(?:s|ed|ing)?)\b/i.test(t)
      && /\b(kid|kids|toddler|child|children|daughter|son|baby|she|he|her|him|year old)\b/i.test(t)
      && !/\b(play|playing|game|games|dance|dancing)\b/i.test(t)) return true;
  return false;
}
function dadRank(query) {
  var bank = window.DADIO_LESSONS || [];
  var scored = bank.map(function (lesson) { return { lesson: lesson, score: dadScore(lesson, query) }; });
  scored = scored.filter(function (r) { return r.score > 0; });
  scored.sort(function (a, b) { return (b.score - a.score) || (a.lesson.n - b.lesson.n); });
  if (dadTodayAsk(query)) {
    var tl = dadTodayLesson();
    if (tl) return [{ lesson: tl, score: 8 }];
  }
  return scored;
}
window.DADIO_MATCH = { score: dadScore, rank: dadRank, THRESHOLD: 4 };
var DADIO_THRESHOLD = 4;
function dadCard(lesson) {
  var art = document.createElement("article");
  art.className = "card";
  var head = document.createElement("p");
  head.className = "card-head";
  head.textContent = lesson.heading;
  art.appendChild(head);
  [["The idea:", lesson.idea], ["Try this tonight:", lesson.move], ["Tonight's play:", lesson.play], ["Why it works:", lesson.why], ["One line to keep:", lesson.core]].forEach(function (part) {
    var p = document.createElement("p");
    var strong = document.createElement("strong");
    strong.textContent = part[0];
    p.appendChild(strong);
    p.appendChild(document.createTextNode(" " + part[1]));
    art.appendChild(p);
  });
  return art;
}
function dadLabel(text) {
  var p = document.createElement("p");
  p.className = "answer-label";
  p.textContent = text;
  return p;
}
/* ---- Ask panel UI (SPEC-DADIO-ASKPANEL-1 + AI chat, 2026-11-01): the
   /ask matcher in place, plus the chat door. The matcher above is
   byte-identical to ask.html's and still runs on this device as the
   fallback: if the chat (POST /api/chat, answers grounded only in the
   45 written lessons) is unreachable, the panel answers with the local
   matcher exactly as it did before, and says so. Chat turns are sent
   to the site's own chat worker; nothing typed is stored there. ---- */
var DP_CSS = [
  "#dp-open{position:fixed;right:1rem;bottom:calc(1rem + env(safe-area-inset-bottom));z-index:70;min-height:52px;padding:0 1.25rem;",
  "border:0;border-radius:999px;background:#0b5e57;color:#fff;font-size:1rem;font-weight:700;",
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
  "box-shadow:0 4px 18px rgba(26,29,33,.30);cursor:pointer}",
  "#dp-open:active{transform:scale(.98)}",
  "#dp-open{transition:transform .25s ease,opacity .25s ease}",
  "#dp-open.dp-away{transform:translateY(170%);opacity:0;pointer-events:none}",
  "#dp-open.dp-hidden{display:none}",
  "#dp-scrim{position:fixed;inset:0;z-index:80;background:rgba(26,29,33,.45)}",
  "#dp-sheet[hidden],#dp-scrim[hidden]{display:none}",
  "#dp-sheet{position:fixed;left:0;right:0;bottom:0;z-index:90;background:#ffffff;color:#1a1d21;",
  "border-radius:1rem 1rem 0 0;box-shadow:0 -6px 30px rgba(26,29,33,.25);max-height:88dvh;",
  "display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
  "line-height:1.55;animation:dpin .25s ease both}",
  "@keyframes dpin{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  "@media (min-width:40rem){#dp-sheet{left:auto;right:1rem;bottom:1rem;width:26rem;border-radius:1rem}}",
  "#dp-sheet .dp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem 1.25rem 0}",
  "#dp-sheet .dp-title{font-size:1.25rem;font-weight:800;letter-spacing:-.01em;margin:0}",
  "#dp-close{flex:none;width:44px;height:44px;border:0;border-radius:.5rem;background:transparent;",
  "color:#1a1d21;font-size:1.5rem;line-height:1;cursor:pointer}",
  "#dp-sheet .dp-body{overflow-y:auto;padding:.75rem 1.25rem 1.5rem;-webkit-overflow-scrolling:touch}",
  "#dp-sheet .dp-promise{color:#2e3338;font-size:.9375rem;margin:0 0 1rem}",
  "#dp-sheet label{display:block;font-weight:600;margin-bottom:.5rem}",
  "#dp-q{width:100%;font-size:1rem;font-family:inherit;padding:.75rem 1rem;min-height:68px;",
  "border:1px solid #c9d1d6;border-radius:.5rem;background:#fff;color:#1a1d21;resize:vertical;box-sizing:border-box}",
  "#dp-find{width:100%;margin-top:.5rem;font-size:1rem;font-weight:700;padding:.75rem 1.25rem;",
  "min-height:48px;border:0;border-radius:.5rem;background:#0b5e57;color:#fff;cursor:pointer}",
  "#dp-sheet button:focus-visible,#dp-sheet textarea:focus-visible,#dp-sheet a:focus-visible{outline:2px solid #0b5e57;outline-offset:2px}",
  "#dp-sheet .dp-ortap{text-align:center;color:#49525b;margin:1.25rem 0 .5rem;font-size:.9375rem}",
  "#dp-sheet .dp-chips{display:flex;flex-direction:column;gap:.5rem}",
  "#dp-sheet .dp-chip{min-height:48px;padding:10px 16px;font-size:1rem;font-weight:600;text-align:left;",
  "border:2px solid #c9d1d6;border-radius:1rem;background:#fff;color:#1a1d21;cursor:pointer;font-family:inherit}",
  "#dp-sheet .dp-chip:active{transform:scale(.99)}",
  "#dp-hint{color:#b91c1c;font-weight:600;min-height:1.5rem;margin-top:.75rem;text-align:center}",
  "#dp-answer{text-align:left;margin-top:.5rem}",
  "#dp-answer .dp-answer-label{font-size:.875rem;font-weight:600;letter-spacing:.08em;",
  "text-transform:uppercase;color:#1a1d21;text-align:center;margin:1rem 0 .5rem}",
  "#dp-answer .dp-card{background:#ffffff;border:1px solid #e2e7ea;border-radius:1rem;",
  "padding:1.5rem 1.25rem;box-shadow:0 2px 10px rgba(0,0,0,.04);margin-bottom:1rem;animation:dpqin .5s ease both}",
  "#dp-answer .dp-card:nth-of-type(2){animation-delay:.08s}",
  "#dp-answer .dp-card:nth-of-type(3){animation-delay:.16s}",
  "@keyframes dpqin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
  "#dp-answer .dp-card .dp-card-head{font-size:.8125rem;font-weight:600;letter-spacing:.06em;",
  "text-transform:uppercase;color:#1a1d21;margin-bottom:.75rem}",
  "#dp-answer .dp-card p{color:#2e3338;margin:0 0 .875rem}",
  "#dp-answer .dp-card p:last-child{margin-bottom:0}",
  "#dp-answer .dp-card p strong{color:#1a1d21}",
  "#dp-answer .dp-card{cursor:pointer}",
  "#dp-answer .dp-card:focus-visible{outline:2px solid #0b5e57;outline-offset:2px}",
  "#dp-answer .dp-nomatch{background:#ffffff;border:1px solid #e2e7ea;border-radius:1rem;padding:1.5rem 1.25rem}",
  "#dp-answer .dp-nomatch p{color:#2e3338;margin:0 0 .875rem}",
  "#dp-answer .dp-nomatch p:last-child{margin-bottom:0}",
  "#dp-answer .dp-nomatch p strong{color:#1a1d21}",
  "#dp-sheet .dp-foot{border-top:1px solid #e2e7ea;margin-top:1.25rem;padding-top:1rem;",
  "font-size:.9375rem;color:#2e3338;text-align:center}",
  "#dp-sheet .dp-foot a{color:#0b5e57;font-weight:700;text-decoration:none;display:inline-block;padding:12px 6px;min-height:44px}",
  "#dp-sheet .dp-foot a:hover{text-decoration:underline}",
  "#dp-sheet .dp-photo{display:block;width:100%;height:auto;border-radius:.75rem;margin:0 0 .75rem}",
  "#dp-answer .dp-bubble{margin:0 0 .5rem}",
  "#dp-answer .dp-bubble{border:1px solid #e2e7ea;border-radius:.75rem;padding:.625rem .75rem;background:#fff;color:#1a1d21}",
  "#dp-answer .dp-bubble p{margin:0;white-space:pre-wrap}",
  "#dp-answer .dp-bubble .dp-who{font-size:.6875rem;font-weight:700;letter-spacing:.05em;color:#1a1d21;margin:0 0 .25rem}",
  "#dp-answer .dp-me{background:#eff6f5;border-color:#cbe0dd}",
  "#dp-answer .dp-busy{color:#0b5e57;font-size:.875rem;min-height:1.25rem;margin:.25rem 0 0}",
  "body.dp-locked{overflow:hidden}",
  "@media (prefers-reduced-motion: reduce){#dp-sheet{animation:none}#dp-answer .dp-card{animation:none}#dp-open{transition:none}}"
].join("\n");
/* Exactly two example taps (Billy's design rule): the first is a
   canonical real moment that returns its written lesson; the second is
   a partial question, covered by two close lessons. Both return
   product (a lesson card), never generic talk. */
var DP_CHIPS = [
  ["Bedtime is a fight every night.", "Bedtime is a fight every night."],
  ["She screams when I say no.", "She screams when I say no."]
];
var dpBuilt = false, dpLastTrigger = null;
/* Session state for the chat worker (the Clearline pattern, copied
   from the rebuilt worker's preview page): the worker is stateless
   and stores nothing; this page holds the thread in memory only —
   the last state the worker returned (last served lesson + tonight's
   plan) and the recent turns — and echoes both with each message, so
   a follow-up ("why does that work though?") can reach the lesson it
   follows. Nothing here is persisted: a page reload starts fresh. */
var dpChatState = null;
var dpChatHistory = [];
/* Instrumentation (Phase B, Dim 10): this panel is the SINGLE firing
   path for the ask events. The FLEET_CFG ask observer was removed from
   index.html/ask.html so an answered chat fires ask_answered exactly
   once (here), a no-match fires ask_fallback (the fleet name; the old
   non-standard ask_no_match is retired), and tool_complete fires once
   per page, on the first answered chat, as the observer used to do. */
var dpAskCompleted = false;
var dpAskStarted = false;
function dpTrackAnswered(props) {
  try { fleetTrack("ask_answered", props); } catch (e) {}
  if (!dpAskCompleted) {
    dpAskCompleted = true;
    /* MEASURE-1 (Nov 5, 2026): the ask complete used to fire with
       no tool_start for surface "ask" anywhere on the page. Fire
       the start immediately before the first complete so the ask
       cohort can never show a complete without a start. */
    if (!dpAskStarted) {
      dpAskStarted = true;
      try { fleetTrack("tool_start", { tool: "dad-ask", surface: "ask", entry: "ask-panel" }); } catch (e) {}
    }
    try { fleetTrack("tool_complete", { tool: "dad-ask", surface: "ask" }); } catch (e) {}
  }
}
function dpTrackFallback(props) {
  try { fleetTrack("ask_fallback", props); } catch (e) {}
}
function dpCard(lesson) {
  var art = dadCard(lesson);
  art.className = "dp-card";
  var head = art.querySelector(".card-head");
  if (head) head.className = "dp-card-head";
  /* DIM 9 (Phase B): the card itself is the tap target to the full
     lesson (the whole card is far over the 44px floor). Lesson fields
     are untouched; this only adds navigation to the card element. */
  if (lesson && lesson.n) {
    art.style.cursor = "pointer";
    art.setAttribute("role", "link");
    art.setAttribute("tabindex", "0");
    art.setAttribute("aria-label", "Read the full lesson: " + lesson.title);
    var dpGoLesson = function () { window.location.href = "/this-week#l" + lesson.n; };
    art.addEventListener("click", dpGoLesson);
    art.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dpGoLesson(); }
    });
  }
  return art;
}
function dpLabel(text) {
  var p = dadLabel(text);
  p.className = "dp-answer-label";
  return p;
}
function dpAskLocal() {
  var q = document.getElementById("dp-q");
  var hint = document.getElementById("dp-hint");
  var answer = document.getElementById("dp-answer");
  hint.textContent = "";
  answer.innerHTML = "";
  if (!dadNorm(q.value)) {
    hint.textContent = "Say the hard part in a few words first.";
    q.focus();
    return;
  }
  if (dadCountAsk(q.value)) {
    var cbox = document.createElement("div");
    cbox.className = "dp-nomatch";
    var cp1 = document.createElement("p");
    var cs1 = document.createElement("strong");
    cs1.textContent = "There are " + (window.DADIO_LESSONS || []).length + " written lessons.";
    cp1.appendChild(cs1);
    var cp2 = document.createElement("p");
    cp2.textContent = "Each one is short: one idea, a real moment to try tonight, a short play idea, why it works, and one line to keep. Try a few plain words for the hard part, or tap an example below.";
    cbox.appendChild(cp1); cbox.appendChild(cp2);
    answer.appendChild(cbox);
    dpTrackAnswered({ tool: "dad-ask", via: "local-count" });
    return;
  }
  if (dadRunOffSafety(q.value)) {
    var sbox = document.createElement("div");
    sbox.className = "dp-nomatch";
    var sp1 = document.createElement("p");
    var ss1 = document.createElement("strong");
    ss1.textContent = "No written lesson fits those words yet.";
    sp1.appendChild(ss1);
    var sp2 = document.createElement("p");
    sp2.textContent = "No written lesson covers running off, bolting, or staying safe near cars, streets, or parking lots. The 45 lessons cover bedtime, play, food, feelings, mornings, fears, sharing, screens, and hard moments. Try a few plain words for another hard part, or tap an example below.";
    sbox.appendChild(sp1); sbox.appendChild(sp2);
    answer.appendChild(sbox);
    dpTrackFallback({ tool: "dad-ask", missing: "safety-runoff" });
    return;
  }
  var ranked = dadRank(q.value);
  var top = ranked.length ? ranked[0] : null;
  if (!top || top.score < DADIO_THRESHOLD) {
    var box = document.createElement("div");
    box.className = "dp-nomatch";
    var p1 = document.createElement("p");
    var s1 = document.createElement("strong");
    s1.textContent = "No written lesson fits those words yet.";
    p1.appendChild(s1);
    var p2 = document.createElement("p");
    p2.textContent = "The 45 lessons cover bedtime, play, food, feelings, mornings, fears, sharing, screens, and hard moments. Try a few plain words for the hard part, or tap an example below.";
    box.appendChild(p1); box.appendChild(p2);
    answer.appendChild(box);
    dpTrackFallback({ tool: "dad-ask", missing: "match" });
    return;
  }
  answer.appendChild(dpLabel("Closest lesson for tonight"));
  answer.appendChild(dpCard(top.lesson));
  var rest = ranked.slice(1, 3).filter(function (r) { return r.score >= 3; });
  if (rest.length) {
    answer.appendChild(dpLabel("Also close"));
    rest.forEach(function (r) { answer.appendChild(dpCard(r.lesson)); });
  }
  dpTrackAnswered({ tool: "dad-ask", lesson: top.lesson.n });
  var first = answer.querySelector(".dp-card");
  if (first) { try { first.scrollIntoView({ block: "nearest" }); } catch (e) {} }
}
/* ---- AI chat send path: POST /api/chat (the site's own worker,
   grounded only in the 45 written lessons). Each send echoes the
   session state + history held in dpChatState/dpChatHistory and
   stores the updated state from the response, exactly as the
   worker's preview page does. On any failure or timeout
   the panel falls back to dpAskLocal above — the matcher on this
   device — and labels the answer as the page's own match. ---- */
function dpBubble(who, text, me) {
  var thread = document.getElementById("dp-answer");
  var d = document.createElement("div");
  d.className = "dp-bubble" + (me ? " dp-me" : "");
  if (who) {
    var w = document.createElement("p");
    w.className = "dp-who";
    w.textContent = who;
    d.appendChild(w);
  }
  var p = document.createElement("p");
  p.textContent = text;
  d.appendChild(p);
  thread.appendChild(d);
  return d;
}
/* Topic grounding for the chat door (SPEC-DAD-COLDQA1106-01): the
   chat's honest-no is only honest when the bank's own filing finds
   nothing. If the chat says there is no lesson but this page's
   matcher — the bank's topic index, on this device — finds one at
   the bar, the filed lesson is the answer, never the false no. The
   run-off safety family keeps its honest-no (dadRunOffSafety runs
   first, exactly as in dpAskLocal), and the count question is not a
   lesson serve. Returns the matcher's top hit or null. */
function dpGroundLesson(q) {
  if (!q || !dadNorm(q)) return null;
  if (dadCountAsk(q)) return null;
  if (dadRunOffSafety(q)) return null;
  var ranked = dadRank(q);
  var top = ranked.length ? ranked[0] : null;
  if (!top || top.score < DADIO_THRESHOLD) return null;
  return top;
}
function dpRenderChat(j, msg) {
  var answer = document.getElementById("dp-answer");
  var lessons = j.lessons || [];
  var nearest = j.nearest || [];
  var lead = j.reply || "";
  if (lessons.length) {
    var idx = lead.indexOf(lessons[0].heading);
    lead = idx > 0 ? lead.slice(0, idx).trim() : "";
    if (lead) dpBubble("DADIOSITY'S AI", lead);
    answer.appendChild(dpLabel("Closest lesson for tonight"));
    answer.appendChild(dpCard(lessons[0]));
    if (lessons.length > 1) {
      answer.appendChild(dpLabel("Also close"));
      lessons.slice(1).forEach(function (l) { answer.appendChild(dpCard(l)); });
    }
    dpTrackAnswered({ tool: "dad-ask", lesson: lessons[0].n, via: "chat" });
  } else {
    var grounded = null;
    /* SPEC-DAD-COLDQA1106B-01 (Nov 7, 2026): the chat has two
       no-lesson leads — the no-match lead below and the off-scope
       lead ("It is outside the written lessons…"). The ground check
       must hear both: "things to do with a 3 year old at home" drew
       the off-scope lead even though the bank files that exact title
       under Lesson 22, so the filed lesson never surfaced in the
       panel. Grounding itself is unchanged — dpGroundLesson still
       serves only when this page's matcher clears the bar, so a
       truly off-scope ask (bitcoin, weather) still renders the
       chat's no, exactly as before. */
    if (/There isn't a written lesson on that yet|No written lesson fits|outside the written lessons/.test(lead)) {
      grounded = dpGroundLesson(msg);
    }
    if (grounded) {
      /* The chat said no lesson; the bank's filing on this page says
         otherwise. Serve the filed lesson and say plainly that the
         page's own match found it — the false no never renders. */
      dpBubble("DADIOSITY'S AI", "The chat said there is no written lesson on that, but the match on this page found one in the bank. Here it is.");
      answer.appendChild(dpLabel("Closest lesson for tonight"));
      answer.appendChild(dpCard(grounded.lesson));
      var grest = dadRank(msg).slice(1, 3).filter(function (r) { return r.score >= 3; });
      if (grest.length) {
        answer.appendChild(dpLabel("Also close"));
        grest.forEach(function (r) { answer.appendChild(dpCard(r.lesson)); });
      }
      dpTrackAnswered({ tool: "dad-ask", lesson: grounded.lesson.n, via: "chat-grounded" });
    } else {
      dpBubble("DADIOSITY'S AI", lead || "Something went wrong. Try again.");
      if (/There isn't a written lesson on that yet/.test(lead)) {
        dpTrackFallback({ tool: "dad-ask", missing: "match", via: "chat" });
      } else {
        dpTrackAnswered({ tool: "dad-ask", via: "chat" });
      }
    }
  }
  if (nearest.length) {
    answer.appendChild(dpLabel("Nearest written lessons"));
    nearest.forEach(function (l) { answer.appendChild(dpCard(l)); });
  }
  var first = answer.querySelector(".dp-card, .dp-bubble");
  if (first) { try { first.scrollIntoView({ block: "nearest" }); } catch (e) {} }
}
function dpRestingNote() {
  var ans = document.getElementById("dp-answer");
  var note = document.createElement("div");
  note.className = "dp-bubble";
  var nw = document.createElement("p"); nw.className = "dp-who"; nw.textContent = "DADIOSITY'S AI";
  var np = document.createElement("p"); np.textContent = "The chat is off right now. Here is the match from this page instead.";
  note.appendChild(nw); note.appendChild(np);
  ans.insertBefore(note, ans.firstChild);
}
function dpSend(text) {
  try { fleetTrack("ask_asked", { tool: "dad-ask", surface: "ask" }); } catch (e) {}
  var q = document.getElementById("dp-q");
  var hint = document.getElementById("dp-hint");
  var answer = document.getElementById("dp-answer");
  var msg = String(text || "").trim();
  hint.textContent = "";
  if (!msg) {
    hint.textContent = "Say the hard part in a few words first.";
    q.focus();
    return;
  }
  var ub = document.createElement("div");
  ub.className = "dp-bubble dp-me";
  var uw = document.createElement("p"); uw.className = "dp-who"; uw.textContent = "YOU";
  var up = document.createElement("p"); up.textContent = msg;
  ub.appendChild(uw); ub.appendChild(up);
  answer.appendChild(ub);
  var busy = document.createElement("p");
  busy.className = "dp-busy";
  busy.textContent = "Dadiosity is thinking\u2026";
  answer.appendChild(busy);
  var done = false;
  var timer = setTimeout(function () {
    if (done) return;
    done = true;
    busy.remove();
    var keep = q.value;
    q.value = msg;
    dpAskLocal();
    q.value = keep;
    dpRestingNote();
  }, 7000);
  fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg, state: dpChatState, history: dpChatHistory })
  }).then(function (r) { return r.json(); }).then(function (j) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    busy.remove();
    if (j.state) dpChatState = j.state;
    dpChatHistory.push({ role: "user", text: msg });
    dpChatHistory.push({ role: "assistant", text: (j.reply || "").slice(0, 400), lesson: (j.lessons && j.lessons[0] && j.lessons[0].n) || undefined });
    if (dpChatHistory.length > 8) dpChatHistory = dpChatHistory.slice(-8);
    dpRenderChat(j, msg);
  }).catch(function () {
    if (done) return;
    done = true;
    clearTimeout(timer);
    busy.remove();
    var keep = q.value;
    q.value = msg;
    dpAskLocal();
    q.value = keep;
    dpRestingNote();
  });
}
function dpAsk() {
  var q = document.getElementById("dp-q");
  dpSend(q.value);
  q.value = "";
}
function dpBuild() {
  if (dpBuilt) return;
  dpBuilt = true;
  var style = document.createElement("style");
  style.textContent = DP_CSS;
  document.head.appendChild(style);
  var open = document.createElement("button");
  open.type = "button";
  open.id = "dp-open";
  open.textContent = "Ask Dadiosity";
  open.setAttribute("aria-haspopup", "dialog");
  document.body.appendChild(open);
  var scrim = document.createElement("div");
  scrim.id = "dp-scrim";
  scrim.hidden = true;
  document.body.appendChild(scrim);
  var sheet = document.createElement("section");
  sheet.id = "dp-sheet";
  sheet.hidden = true;
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "Ask Dadiosity");
  var head = document.createElement("div");
  head.className = "dp-head";
  var title = document.createElement("p");
  title.className = "dp-title";
  title.textContent = "Dealing with something tonight?";
  var close = document.createElement("button");
  close.type = "button";
  close.id = "dp-close";
  close.setAttribute("aria-label", "Close");
  close.textContent = "\u00D7";
  head.appendChild(title); head.appendChild(close);
  sheet.appendChild(head);
  var bodyEl = document.createElement("div");
  bodyEl.className = "dp-body";
  var promise = document.createElement("p");
  promise.className = "dp-promise";
  promise.textContent = "Chat with Dadiosity's AI. Your words are sent to the chat, which answers only from the 45 written lessons on this site. If there is no written lesson on something, it will say so, in plain words. Nothing you type is saved. (The /ask page is different: it matches on your device and sends nothing.)";
  bodyEl.appendChild(promise);
  var photo = document.createElement("img");
  photo.className = "dp-photo";
  photo.src = "/assets/table-meal.jpg";
  photo.width = 600; photo.height = 400;
  photo.alt = "A dad shares a meal with his toddler at the table.";
  bodyEl.appendChild(photo);
  var opening = document.createElement("div");
  opening.className = "dp-bubble";
  opening.style.cssText = "border:1px solid #e2e7ea;border-radius:.75rem;padding:.625rem .75rem;background:#fff;margin:0 0 .75rem";
  var ow = document.createElement("p");
  ow.style.cssText = "font-size:.6875rem;font-weight:700;letter-spacing:.05em;color:#1a1d21;margin:0 0 .25rem";
  ow.textContent = "DADIOSITY'S AI";
  var op = document.createElement("p");
  op.style.cssText = "margin:0";
  op.textContent = "Hi, I'm Dadiosity's AI assistant. Say tonight's hard part in your own words, and I will bring you the written lesson that fits.";
  opening.appendChild(ow); opening.appendChild(op);
  bodyEl.appendChild(opening);
  var label = document.createElement("label");
  label.htmlFor = "dp-q";
  label.textContent = "Tonight's hard part, in your words";
  bodyEl.appendChild(label);
  var ta = document.createElement("textarea");
  ta.id = "dp-q";
  ta.rows = 3;
  ta.placeholder = "Bedtime is a fight every night.";
  bodyEl.appendChild(ta);
  var find = document.createElement("button");
  find.type = "button";
  find.id = "dp-find";
  find.textContent = "Send";
  bodyEl.appendChild(find);
  var hint = document.createElement("p");
  hint.id = "dp-hint";
  hint.setAttribute("role", "alert");
  bodyEl.appendChild(hint);
  var answer = document.createElement("section");
  answer.id = "dp-answer";
  answer.setAttribute("aria-live", "polite");
  bodyEl.appendChild(answer);
  var ortap = document.createElement("p");
  ortap.className = "dp-ortap";
  ortap.textContent = "Or tap an example:";
  bodyEl.appendChild(ortap);
  var chips = document.createElement("div");
  chips.className = "dp-chips";
  chips.setAttribute("role", "group");
  chips.setAttribute("aria-label", "Example questions");
  DP_CHIPS.forEach(function (pair) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "dp-chip";
    b.setAttribute("data-q", pair[0]);
    b.textContent = pair[1];
    b.addEventListener("click", function () {
      dpSend(b.getAttribute("data-q") || "");
    });
    chips.appendChild(b);
  });
  bodyEl.appendChild(chips);
  var foot = document.createElement("p");
  foot.className = "dp-foot";
  foot.appendChild(document.createTextNode("Real lessons only. No match, said plain. If the chat is off, this page finds your lesson itself."));
  foot.appendChild(document.createElement("br"));
  var full = document.createElement("a");
  full.href = "/ask";
  full.textContent = "Open the full Ask page";
  foot.appendChild(full);
  bodyEl.appendChild(foot);
  sheet.appendChild(bodyEl);
  document.body.appendChild(sheet);
  open.addEventListener("click", function () { dpOpen(open); });
  /* ==== FLEET YIELD GUARD (adoption, ADOPTION-SPEC Dadiosity section;
     Phase B 2026-11-01) — replaces the old dp-away guard, which watched
     only the homepage hero <h1> and never ran its target logic on the
     question pages. This guard watches ANY visible interactive element
     (the reference selector set) on every page that carries the pill.
     The pill's RESTING box is computed once per layout from its
     untransformed CSS position + offset size — never from its rendered
     rect, so the yield transform cannot feed back (the PMC oscillation
     bug). A 6px hysteresis band on the return check keeps the state
     sticky at boundary scrolls. A focused pill never yields; an open
     panel never yields. Everything outside this block is unchanged. */
  var FYG_SEL = "a[href],button,input,select,textarea,summary,[role=\"button\"],[role=\"link\"],[role=\"tab\"],[role=\"menuitem\"],[tabindex]:not([tabindex=\"-1\"]),[data-fyg-watch]";
  var fygTargets = [], fygYielded = false, fygTick = false, fygResting = null;
  var fygHideTimer = null;
  function fygSetYield(on) {
    if (on === fygYielded) return;
    fygYielded = on;
    if (fygHideTimer) { clearTimeout(fygHideTimer); fygHideTimer = null; }
    if (on) {
      open.classList.add("dp-away");
      /* Fleet sweep 2026-11-04 (PMR SPEC-05 pattern): after the slide-out
         finishes, remove the pill from layout. Parked below the fold it
         still had a 52px rect that overlapped tap targets scrolling near
         the bottom edge under the fleet's rect-based settled sweep
         (44 covered targets at 390px pre-fix). With display:none the
         rect is zero and the settled pill can cover nothing. */
      fygHideTimer = setTimeout(function () {
        fygHideTimer = null;
        if (fygYielded) open.classList.add("dp-hidden");
      }, 300);
    } else {
      open.classList.remove("dp-hidden");
      void open.offsetWidth; /* reflow so the slide back in still animates */
      open.classList.remove("dp-away");
    }
  }
  function fygComputeResting() {
    var cs = window.getComputedStyle(open);
    var w = open.offsetWidth, h = open.offsetHeight;
    if (!w || !h) { return; } /* Fleet sweep 2026-11-04: pill may be display:none while yielded; keep the last known box */
    var vw = window.innerWidth, vh = window.innerHeight;
    var left = parseFloat(cs.left), right = parseFloat(cs.right);
    var top = parseFloat(cs.top), bottom = parseFloat(cs.bottom);
    var box = {};
    if (!isNaN(left) && cs.left !== "auto") box.left = left;
    else if (!isNaN(right) && cs.right !== "auto") box.left = vw - right - w;
    else box.left = vw - w;
    if (!isNaN(top) && cs.top !== "auto") box.top = top;
    else if (!isNaN(bottom) && cs.bottom !== "auto") box.top = vh - bottom - h;
    else box.top = vh - h;
    box.right = box.left + w;
    box.bottom = box.top + h;
    fygResting = box;
  }
  function fygCollect() {
    var list = document.querySelectorAll(FYG_SEL);
    fygTargets = [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === open || open.contains(el)) continue;
      if (el === sheet || sheet.contains(el)) continue;
      if (el === scrim || scrim.contains(el)) continue;
      fygTargets.push(el);
    }
  }
  function fygKeyboardFocus() {
    /* The focus exemption is for KEYBOARD users (a tabbed-to pill must
       stay put). dpClose returns focus to the pill programmatically
       after touch closes too; :focus-visible separates the two — a
       touch-closed pill must be free to yield again on scroll. */
    if (document.activeElement !== open && !open.contains(document.activeElement)) return false;
    try { return open.matches(":focus-visible"); } catch (e) { return true; }
  }
  function fygUpdate() {
    fygTick = false;
    if (!sheet.hidden) { fygSetYield(false); return; }
    if (fygKeyboardFocus()) { fygSetYield(false); return; }
    if (!fygResting) fygComputeResting();
    if (!fygResting) return;
    var ex = fygYielded ? 6 : 0, box = fygResting, hit = false;
    for (var i = 0; i < fygTargets.length; i++) {
      var el = fygTargets[i];
      if (!el.getClientRects || !el.getClientRects().length) continue;
      var cs = window.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      var b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (b.bottom > box.top - ex && b.top < box.bottom + ex && b.right > box.left - ex && b.left < box.right + ex) { hit = true; break; }
    }
    fygSetYield(hit);
  }
  function fygSchedule() {
    if (fygTick) return;
    fygTick = true;
    requestAnimationFrame(fygUpdate);
  }
  function fygRelayout() {
    /* Fleet sweep 2026-11-04: while the pill is display:none (yielded) it
       has no size; keep the last known box rather than dropping it. */
    if (open.offsetWidth) fygResting = null;
    fygCollect();
    fygSchedule();
  }
  window.addEventListener("scroll", fygSchedule, { passive: true });
  window.addEventListener("resize", fygRelayout);
  window.addEventListener("orientationchange", fygRelayout);
  window.addEventListener("load", fygRelayout);
  open.addEventListener("focus", fygSchedule, true);
  open.addEventListener("blur", fygSchedule, true);
  if (window.MutationObserver) {
    new MutationObserver(function () { fygCollect(); fygSchedule(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style", "class"] });
  }
  fygCollect();
  fygComputeResting();
  fygUpdate();
  /* ==== END FLEET YIELD GUARD ==== */
  close.addEventListener("click", dpClose);
  scrim.addEventListener("click", dpClose);
  find.addEventListener("click", dpAsk);
  ta.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); dpAsk(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) dpClose();
  });
  document.querySelectorAll('a.askbtn[href="/ask"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); dpOpen(a); });
  });
}
function dpOpen(trigger) {
  dpBuild();
  dpLastTrigger = trigger || null;
  document.getElementById("dp-scrim").hidden = false;
  document.getElementById("dp-sheet").hidden = false;
  document.body.classList.add("dp-locked");
  var q = document.getElementById("dp-q");
  if (q) { try { q.focus({ preventScroll: true }); } catch (e) { q.focus(); } }
}
function dpClose() {
  document.getElementById("dp-scrim").hidden = true;
  document.getElementById("dp-sheet").hidden = true;
  document.body.classList.remove("dp-locked");
  if (dpLastTrigger && dpLastTrigger.focus) { try { dpLastTrigger.focus({ preventScroll: true }); } catch (e) {} }
}
dpBuild();
})();
