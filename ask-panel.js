/* Dadiosity ask panel (SPEC-DADIO-ASKPANEL-1): the /ask lesson matcher,
   in place on the homepage and the question pages. The matcher block
   below is byte-identical to the one ask.html runs (extracted, never
   retyped); the panel tail only adds the door and the sheet. The match
   runs on the visitor's device. Nothing typed is sent or saved. */
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
var DADIO_NEUTRAL = {};
("grocery store toddler time much too").split(" ").forEach(function (w) { DADIO_NEUTRAL[w] = 1; });
var DADIO_LIGHT = {};
("get take make go come keep give let put try help want").split(" ").forEach(function (w) { DADIO_LIGHT[w] = 1; });
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
var DADIO_SYN = { scream: "cry", nightmare: "fight", nitemare: "fight", dawdle: "slow", dawdl: "slow" };
var DADIO_VOCAB = null;
function dadVocab() {
  if (DADIO_VOCAB) return DADIO_VOCAB;
  var tt = {}, all = {}, rawTT = [], rawSeen = {};
  (window.DADIO_LESSONS || []).forEach(function (lesson) {
    (lesson.topics || []).forEach(function (t) {
      dadTokens(t).forEach(function (w) { tt[w] = 1; all[w] = 1; });
      dadTokenPairs(t).forEach(function (p) { if (!rawSeen[p.raw]) { rawSeen[p.raw] = 1; rawTT.push(p); } });
    });
    dadTokens(lesson.title).forEach(function (w) { tt[w] = 1; all[w] = 1; });
    dadTokenPairs(lesson.title).forEach(function (p) { if (!rawSeen[p.raw]) { rawSeen[p.raw] = 1; rawTT.push(p); } });
    dadTokens(lesson.idea + " " + lesson.move + " " + lesson.play + " " + lesson.why + " " + lesson.core).forEach(function (w) { all[w] = 1; });
  });
  DADIO_VOCAB = { tt: Object.keys(tt), ttSet: tt, all: all, rawTT: rawTT };
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
  var pass = false;
  if (phraseFull || surfacePhrase) pass = true;
  else if (denomToks.length === 1 && fullNPCount === 1) pass = true;
  else if (npCount >= 2 && fullNPCount >= 1) pass = true;
  else if (npCount >= 3 && denomToks.some(function (t) { return partial[t]; })) pass = true;
  else if (denomToks.length > 0 && unmatched.length === 0 && npCount >= 1) pass = true;
  else if (unmatched.length === 1 && DADIO_LIGHT[unmatched[0]] && fullNPCount >= 1) pass = true;
  if (!pass && score > 3) score = 3;
  return score;
}
function dadRank(query) {
  var bank = window.DADIO_LESSONS || [];
  var scored = bank.map(function (lesson) { return { lesson: lesson, score: dadScore(lesson, query) }; });
  scored = scored.filter(function (r) { return r.score > 0; });
  scored.sort(function (a, b) { return (b.score - a.score) || (a.lesson.n - b.lesson.n); });
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
/* ---- Ask panel UI (SPEC-DADIO-ASKPANEL-1): the /ask matcher in place.
   The matcher above is byte-identical to ask.html's; this tail only adds
   the door and the sheet. The match runs on this device: nothing typed
   here is sent or saved, exactly as on /ask. ---- */
var DP_CSS = [
  "#dp-open{position:fixed;right:1rem;bottom:1rem;z-index:70;min-height:52px;padding:0 1.25rem;",
  "border:0;border-radius:999px;background:#b45309;color:#fff;font-size:1rem;font-weight:700;",
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
  "box-shadow:0 4px 18px rgba(43,33,24,.30);cursor:pointer}",
  "#dp-open:active{transform:scale(.98)}",
  "#dp-open{transition:transform .25s ease,opacity .25s ease}",
  "#dp-open.dp-away{transform:translateY(170%);opacity:0;pointer-events:none}",
  "#dp-scrim{position:fixed;inset:0;z-index:80;background:rgba(43,33,24,.45)}",
  "#dp-sheet[hidden],#dp-scrim[hidden]{display:none}",
  "#dp-sheet{position:fixed;left:0;right:0;bottom:0;z-index:90;background:#fff8ec;color:#2b2118;",
  "border-radius:1rem 1rem 0 0;box-shadow:0 -6px 30px rgba(43,33,24,.25);max-height:88dvh;",
  "display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
  "line-height:1.5;animation:dpin .25s ease both}",
  "@keyframes dpin{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  "@media (min-width:40rem){#dp-sheet{left:auto;right:1rem;bottom:1rem;width:26rem;border-radius:1rem}}",
  "#dp-sheet .dp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem 1.25rem 0}",
  "#dp-sheet .dp-title{font-size:1.25rem;font-weight:800;letter-spacing:-.01em;margin:0}",
  "#dp-close{flex:none;width:44px;height:44px;border:0;border-radius:.5rem;background:transparent;",
  "color:#2b2118;font-size:1.5rem;line-height:1;cursor:pointer}",
  "#dp-sheet .dp-body{overflow-y:auto;padding:.75rem 1.25rem 1.5rem;-webkit-overflow-scrolling:touch}",
  "#dp-sheet .dp-promise{color:#4a3f35;font-size:.9375rem;margin:0 0 1rem}",
  "#dp-sheet label{display:block;font-weight:600;margin-bottom:.5rem}",
  "#dp-q{width:100%;font-size:1rem;font-family:inherit;padding:.75rem 1rem;min-height:68px;",
  "border:1px solid #e0d3bd;border-radius:.5rem;background:#fff;color:#2b2118;resize:vertical;box-sizing:border-box}",
  "#dp-find{width:100%;margin-top:.5rem;font-size:1rem;font-weight:700;padding:.75rem 1.25rem;",
  "min-height:48px;border:0;border-radius:.5rem;background:#b45309;color:#fff;cursor:pointer}",
  "#dp-sheet button:focus-visible,#dp-sheet textarea:focus-visible,#dp-sheet a:focus-visible{outline:2px solid #d97706;outline-offset:2px}",
  "#dp-sheet .dp-ortap{text-align:center;color:#6f6154;margin:1.25rem 0 .5rem;font-size:.9375rem}",
  "#dp-sheet .dp-chips{display:flex;flex-direction:column;gap:.5rem}",
  "#dp-sheet .dp-chip{min-height:48px;padding:10px 16px;font-size:1rem;font-weight:600;text-align:left;",
  "border:2px solid #e0d3bd;border-radius:1rem;background:#fff;color:#2b2118;cursor:pointer;font-family:inherit}",
  "#dp-sheet .dp-chip:active{transform:scale(.99)}",
  "#dp-hint{color:#b91c1c;font-weight:600;min-height:1.5rem;margin-top:.75rem;text-align:center}",
  "#dp-answer{text-align:left;margin-top:.5rem}",
  "#dp-answer .dp-answer-label{font-size:.875rem;font-weight:600;letter-spacing:.08em;",
  "text-transform:uppercase;color:#b45309;text-align:center;margin:1rem 0 .5rem}",
  "#dp-answer .dp-card{background:#fffaf0;border:1px solid #f0dfba;border-radius:1rem;",
  "padding:1.5rem 1.25rem;box-shadow:0 2px 10px rgba(0,0,0,.04);margin-bottom:1rem;animation:dpqin .5s ease both}",
  "#dp-answer .dp-card:nth-of-type(2){animation-delay:.08s}",
  "#dp-answer .dp-card:nth-of-type(3){animation-delay:.16s}",
  "@keyframes dpqin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
  "#dp-answer .dp-card .dp-card-head{font-size:.8125rem;font-weight:600;letter-spacing:.06em;",
  "text-transform:uppercase;color:#b45309;margin-bottom:.75rem}",
  "#dp-answer .dp-card p{color:#4a3f35;margin:0 0 .875rem}",
  "#dp-answer .dp-card p:last-child{margin-bottom:0}",
  "#dp-answer .dp-card p strong{color:#2b2118}",
  "#dp-answer .dp-nomatch{background:#fffaf0;border:1px solid #f0dfba;border-radius:1rem;padding:1.5rem 1.25rem}",
  "#dp-answer .dp-nomatch p{color:#4a3f35;margin:0 0 .875rem}",
  "#dp-answer .dp-nomatch p:last-child{margin-bottom:0}",
  "#dp-answer .dp-nomatch p strong{color:#2b2118}",
  "#dp-sheet .dp-foot{border-top:1px solid #eee0c8;margin-top:1.25rem;padding-top:1rem;",
  "font-size:.9375rem;color:#4a3f35;text-align:center}",
  "#dp-sheet .dp-foot a{color:#b45309;font-weight:700;text-decoration:none;display:inline-block;padding:12px 6px;min-height:44px}",
  "#dp-sheet .dp-foot a:hover{text-decoration:underline}",
  "body.dp-locked{overflow:hidden}",
  "@media (prefers-reduced-motion: reduce){#dp-sheet{animation:none}#dp-answer .dp-card{animation:none}#dp-open{transition:none}}"
].join("\n");
var DP_CHIPS = [
  ["Bedtime is a fight every night.", "Bedtime is a fight every night"],
  ["She won't eat at restaurants.", "She won't eat at restaurants"],
  ["She won't listen to me.", "She won't listen to me"],
  ["I yelled at her and I feel awful.", "I yelled at her and I feel awful"],
  ["How do I play with her?", "How do I play with her?"]
];
var dpBuilt = false, dpLastTrigger = null;
function dpCard(lesson) {
  var art = dadCard(lesson);
  art.className = "dp-card";
  var head = art.querySelector(".card-head");
  if (head) head.className = "dp-card-head";
  return art;
}
function dpLabel(text) {
  var p = dadLabel(text);
  p.className = "dp-answer-label";
  return p;
}
function dpAsk() {
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
    p2.textContent = "The 31 lessons cover bedtime, play, food, feelings, mornings, and hard moments. Try a few plain words for the hard part, or tap an example below.";
    box.appendChild(p1); box.appendChild(p2);
    answer.appendChild(box);
    try { fleetTrack("ask_no_match", { tool: "dad-ask" }); } catch (e) {}
    return;
  }
  answer.appendChild(dpLabel("Closest lesson for tonight"));
  answer.appendChild(dpCard(top.lesson));
  var rest = ranked.slice(1, 3).filter(function (r) { return r.score >= 3; });
  if (rest.length) {
    answer.appendChild(dpLabel("Also close"));
    rest.forEach(function (r) { answer.appendChild(dpCard(r.lesson)); });
  }
  try { fleetTrack("ask_answered", { tool: "dad-ask", lesson: top.lesson.n }); } catch (e) {}
  var first = answer.querySelector(".dp-card");
  if (first) { try { first.scrollIntoView({ block: "nearest" }); } catch (e) {} }
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
  promise.textContent = "Say tonight's hard part in your own words. We match your words to one of the 31 written lessons, right on this page. Nothing you type is sent or saved.";
  bodyEl.appendChild(promise);
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
  find.textContent = "Find my lesson";
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
      document.getElementById("dp-q").value = b.getAttribute("data-q") || "";
      dpAsk();
    });
    chips.appendChild(b);
  });
  bodyEl.appendChild(chips);
  var foot = document.createElement("p");
  foot.className = "dp-foot";
  foot.appendChild(document.createTextNode("Real lessons only. No match, said plain."));
  foot.appendChild(document.createElement("br"));
  var full = document.createElement("a");
  full.href = "/ask";
  full.textContent = "Open the full Ask page";
  foot.appendChild(full);
  bodyEl.appendChild(foot);
  sheet.appendChild(bodyEl);
  document.body.appendChild(sheet);
  open.addEventListener("click", function () { dpOpen(open); });
  /* Wordmark clearance: on the homepage the fixed pill can land on the
     hero "Dadiosity" title at some scroll positions. While the title is
     inside the pill's fixed box, slide the pill out of the way; it returns
     as soon as the title scrolls clear. The pill's box is computed from
     its layout size (offsetWidth/Height ignore the slide transform, so
     the check cannot flicker). No hero title, no change. */
  var heroTitle = document.querySelector(".hero h1");
  if (heroTitle && open.offsetHeight) {
    var dpTick = false;
    var dpClear = function () {
      dpTick = false;
      if (!sheet.hidden) return;
      var t = heroTitle.getBoundingClientRect();
      var oB = window.innerHeight - 16, oT = oB - open.offsetHeight;
      var oR = window.innerWidth - 16, oL = oR - open.offsetWidth;
      var hit = t.bottom > oT - 8 && t.top < oB + 8 && t.right > oL - 8 && t.left < oR + 8;
      open.classList.toggle("dp-away", hit);
    };
    var dpOnScroll = function () {
      if (!dpTick) { dpTick = true; requestAnimationFrame(dpClear); }
    };
    window.addEventListener("scroll", dpOnScroll, { passive: true });
    window.addEventListener("resize", dpOnScroll);
    window.addEventListener("load", dpOnScroll);
    dpClear();
  }
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
