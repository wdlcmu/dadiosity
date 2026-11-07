#!/usr/bin/env python3
"""Export the 45 Dadiosity lessons from the six bank markdown files to the
site data file lessons.js (SPEC-DADIO-ASK-1, ship-queue Addendum 756; full
bank Nov 3, 2026).

Source of truth: lessons-week-1-2026-10-24.md .. lessons-week-6-2026-11-03.md.
Every lesson field is copied VERBATIM from the bank: heading, the four parts
(The idea / Tonight's move / Tonight's play / Why it works), the Core move
line, and the Tonight's puzzle line (the curiosity-gap opener added Nov 2,
2026: one scene question per lesson, closed by the lesson's move). The added
data is metadata only, never displayed as lesson copy: `topics` (matcher
phrases a dad might type) and the structured fields from META (moment, slot,
motivation, age band, child-interest tags, and the named science source the
lesson stands on; sources are verified and recorded in the full-bank report).

Run: python3 gen-lessons.py  -> writes lessons.js + ask-ship evidence expected.json
Asserts: 45 lessons, Days 1..45 in order, all five parts present, puzzle
present and a real question, no em/en dash in lesson text, core moves
unique, metadata complete for every lesson.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = [
    "lessons-week-1-2026-10-24.md",
    "lessons-week-2-2026-10-24.md",
    "lessons-week-3-2026-10-25.md",
    "lessons-week-4-2026-10-25.md",
    "lessons-week-5-2026-10-30.md",
    "lessons-week-6-2026-11-03.md",
]

# Matcher metadata only: phrases/topics per lesson number. Not lesson text.
# SPEC-DAD-COLDQA1106B-01 (Nov 7, 2026): lessons 6 / 12 / 22 are also filed
# under the site's own question-page titles ("make bedtime easier", "make
# morning easier", "things to do ... at home", "morning routine"). File
# SINGULAR forms only: a plural topic word ("mornings") tokenizes to a stem
# the stemmer never produces for the bank ("morning" vs "morn"), which
# poisons the spelling-correction guard and breaks the singular filings.
TOPICS = {
    1: ["eye level", "get low", "won't listen", "not listening", "listen", "hear me", "get her attention", "attention"],
    2: ["feelings", "name the feeling", "upset", "mad", "big feelings", "crying", "she is mad", "emotions", "sad", "feels sad", "she is sad", "grandma left", "grandpa left", "grandma went home", "grandpa went home", "someone left", "misses grandma", "misses grandpa", "sad goodbye"],
    3: ["switch", "transition", "leaving", "stop playing", "warning", "change", "time to go", "ends"],
    4: ["talking", "words", "speech", "narrate", "vocabulary", "say what you see", "late talker", "language"],
    5: ["yelled", "snapped", "lost my temper", "lost temper", "say sorry", "repair", "shouted", "i yelled", "raised my voice"],
    6: ["make bedtime easier", "bedtime easier", "bedtime", "sleep", "bedtime fight", "won't sleep", "go to sleep", "routine", "bedtime routine", "stays in bed", "bed without a fight", "toddler bed without a fight", "get her to bed without a fight", "bedtime without a fight"],
    7: ["bedtime", "end of the day", "good thing", "last words", "good moment", "bedtime talk"],
    8: ["choices", "choice", "power struggle", "control", "won't pick", "pick", "order", "say in her day"],
    9: ["won't listen", "not listening", "ask once", "pause", "ignores me", "repeat myself", "asking"],
    10: ["real job", "help", "helper", "chores", "give her a job", "involved", "task for her"],
    11: ["hold the line", "limit", "boundary", "say no", "stay close", "rule", "line holds"],
    12: ["make morning easier", "morning easier", "morning routine", "morning", "wake up", "rush", "slow morning", "morning rush", "get ready"],
    13: ["tidy", "clean up", "tidy up", "toys away", "mess", "song", "put toys away"],
    14: ["outside", "walk", "nature", "stop and look", "wonder", "present", "slow down outside", "finds things"],
    15: ["finish", "interrupt", "keeps interrupting", "patience", "let her finish", "wait for her", "slow play"],
    16: ["let her try", "independent", "do it herself", "help too much", "hands back", "struggle", "try on her own"],
    17: ["praise", "good out loud", "encourage", "catch the good", "well done", "good behavior"],
    18: ["voice down", "calm voice", "yelling", "loud voice", "bring your voice down", "shouting", "quiet voice"],
    19: ["teach me", "let her teach", "she teaches", "learn from her", "her turn to lead"],
    20: ["wiggles", "energy", "restless", "shake it out", "calm body", "sit still", "move first"],
    21: ["hello", "coming home", "greeting", "big hello", "arrive home", "reunion"],
    # SPEC-DAD-VERIFY1935-02 (Nov 7, 2026): "inside" is the everyday
    # synonym of the "indoor" filed by SPEC-DAD-COLDQA1106B-03, but it
    # was filed nowhere, so "things to do inside" and "inside
    # activities for a toddler" dead-ended while the indoor twins
    # served. Bare "inside" alone closes only the one-content-word
    # shape ("what to do inside with my toddler"); the phrase forms
    # mirror the indoor filings ("inside activity" beside "indoor
    # activity", "things to do inside" beside "things to do at
    # home"), and "pouring" is the rain word in "what to do inside
    # when it pours all day" — the same weather-word class as the
    # "rainy" already filed here. Fences hold: "inside pool hours
    # near me" still names no second anchor and stays a no-match,
    # as do the rain-statement questions.
    # SPEC-DAD-VERIFY1945-02 (Nov 7, 2026): the bare phrase with
    # "indoors" was never filed — only "things to do inside" was —
    # so "things to do indoors" dead-ended at 3 while every
    # neighbouring indoors shape served on the "indoor" stem.
    # Both bare phrase forms are filed here, mirroring "things to
    # do inside": "things to do indoors" and its singular twin
    # "things to do indoor". Fences hold: "inside pool hours near
    # me" and "will it pour tomorrow" stay no-matches.
    22: ["things to do at home", "things to do with a 3 year old at home", "play at home", "activities at home", "rainy day", "rainy", "rainy day activity", "rainy activity", "indoor", "indoor activity", "inside", "inside activity", "things to do inside", "things to do indoors", "things to do indoor", "pouring", "play", "how to play", "pretend", "follow her lead", "play with her", "playtime", "toys"],
    23: ["breathe", "breathing", "calm down", "slow breath", "big feelings", "settle"],
    24: ["tantrum", "meltdown", "melt down", "check the body", "hungry", "tired", "fell apart", "body first", "won't listen"],
    25: ["story", "when you were small", "your childhood", "tell her a story", "stories about you"],
    26: ["phone", "phones", "screen", "distracted", "present dad", "phone away", "table"],
    27: ["gift", "make a gift", "kind", "giving", "for someone", "make something for"],
    28: ["tomorrow", "one thing for tomorrow", "look forward", "plan tomorrow", "bedtime plan"],
    29: ["eat", "eating", "picky", "picky eater", "won't eat", "food", "new food", "vegetables", "dinner", "meal", "restaurant"],
    30: ["distract", "distraction", "redirect", "stuck", "stuck on", "new thing", "won't stop", "loop"],
    31: ["prevent tantrums", "tantrum", "prevent", "meltdown", "melt down", "hard part", "trip out", "before we go", "stack", "plan ahead"],
    32: ["dark", "afraid of the dark", "scared", "monsters", "night light", "fear", "scared at night", "afraid"],
    33: ["drop-off", "dropoff", "drop off", "goodbye", "daycare", "school goodbye", "cries when i leave", "separation", "leave her"],
    34: ["sharing", "share", "mine", "won't share", "grabbing toys", "turns", "her turn"],
    35: ["hitting", "hits", "hit", "kicking", "biting", "bites", "bite", "bitten", "bites kids", "biting kids", "keeps biting", "pushing", "hurts other kids", "aggressive", "hitting kids", "hits kids", "hits other kids", "won't stop hitting"],
    36: ["screen", "screens", "tablet", "tv", "show ends", "turn off the tv", "screen time", "ipad"],
    37: ["teeth", "brush teeth", "brushing", "toothbrush", "won't brush", "refuses the toothbrush", "won't use her toothbrush", "refuses to brush"],
    38: ["shoes", "getting dressed", "dressed", "leaving the house", "coat", "out the door", "getting ready to leave"],
    39: ["waiting", "wait", "line", "queue", "restaurant wait", "in line", "patience in public", "grocery line"],
    40: ["new baby", "baby coming", "sibling", "big sister", "pregnant", "new sibling", "baby brother", "baby sister"],
    41: ["sorry", "apologize", "make it right", "fix it", "hurt a friend", "broke it", "make amends"],
    42: ["whining", "whine", "whiny voice", "nags", "nagging", "stop whining", "won't stop whining", "whining all day", "whiny"],
    43: ["bath", "won't take a bath", "hates bath", "bath fight", "bathtub"],
    44: ["leaves the table", "won't sit", "sit at the table", "gets down", "meal ends", "chair", "table manners"],
    45: ["car", "car ride", "car seat", "drive", "driving", "kicks the seat", "road trip"],
}

# Structured metadata for every lesson (full bank, Nov 3, 2026). moment =
# the recurring family moment the lesson serves; slot = position in the day
# or the evening skeleton (dinner, block, bath, close, morning, anytime);
# motivation = the dad-side reason this lesson exists; age = age band in
# years; interests = child-interest tags; source = the named, web-verified
# science the lesson stands on (kept out of lesson text by house rule).
META = {
    1:  dict(moment='listening', slot='anytime', motivation='Be heard the first time, not the fifth.', age=[1, 4], interests=[], source='Faber & King, How to Talk So Little Kids Will Listen (2017)'),
    2:  dict(moment='big feelings', slot='anytime', motivation='End the storm sooner, with words instead of volume.', age=[2, 5], interests=[], source='Siegel & Bryson, The Whole-Brain Child (2011)'),
    3:  dict(moment='transitions', slot='anytime', motivation='Leave the park without the carry-out.', age=[2, 4], interests=[], source='Faber & King, How to Talk So Little Kids Will Listen (2017)'),
    4:  dict(moment='language and talk', slot='anytime', motivation='Build her words just by talking through the day.', age=[1, 3], interests=[], source='National Scientific Council on the Developing Child, Working Paper No. 1 (2004), serve and return'),
    5:  dict(moment='repair after you snap', slot='anytime', motivation='Not carry a snapped moment into the whole evening.', age=[2, 5], interests=[], source='Siegel & Bryson, No-Drama Discipline (2014)'),
    6:  dict(moment='bedtime', slot='close', motivation='Get your evening back, on time most nights.', age=[1, 4], interests=[], source='Mindell, Sleeping Through the Night (rev. ed. 2005)'),
    7:  dict(moment='bedtime', slot='close', motivation='Be the last voice she hears, and make it a good one.', age=[2, 5], interests=[], source='Gottman & DeClaire, Raising an Emotionally Intelligent Child (1997), emotion coaching'),
    8:  dict(moment='independence', slot='anytime', motivation='Keep a say in her day without a power war.', age=[2, 4], interests=[], source='Ryan & Deci, American Psychologist 55(1) (2000), self-determination theory'),
    9:  dict(moment='listening', slot='anytime', motivation='Stop repeating yourself all evening.', age=[2, 4], interests=[], source='Faber & King, How to Talk So Little Kids Will Listen (2017)'),
    10: dict(moment='helping', slot='block', motivation='Have a helper, not an audience.', age=[2, 4], interests=[], source='Davies, The Montessori Toddler (2019)'),
    11: dict(moment='holding a limit', slot='anytime', motivation='Hold a rule without becoming the bad guy.', age=[2, 4], interests=[], source='Siegel & Bryson, No-Drama Discipline (2014)'),
    12: dict(moment='mornings', slot='morning', motivation='Start the day connected instead of already behind.', age=[2, 4], interests=[], source='ZERO TO THREE, toddler development and routines guides (zerotothree.org)'),
    13: dict(moment='cleanup', slot='block', motivation='End play without a nightly tidy fight.', age=[2, 4], interests=['music'], source='Yogman et al., The Power of Play, AAP clinical report, Pediatrics (2018)'),
    14: dict(moment='being outside', slot='anytime', motivation='Slow down enough to actually be there.', age=[2, 4], interests=['nature'], source='Louv, Last Child in the Woods (2005)'),
    15: dict(moment='listening', slot='anytime', motivation='Hear the whole story, not the first half.', age=[3, 5], interests=[], source='National Scientific Council on the Developing Child, Working Paper No. 1 (2004), serve and return'),
    16: dict(moment='independence', slot='anytime', motivation='Raise a kid who tries hard things.', age=[2, 4], interests=[], source='Ryan & Deci, American Psychologist 55(1) (2000), self-determination theory'),
    17: dict(moment='praise', slot='anytime', motivation='Grow the behavior you want by naming it.', age=[2, 5], interests=[], source='Mueller & Dweck, Journal of Personality and Social Psychology 75(1) (1998), process praise'),
    18: dict(moment='your own calm', slot='anytime', motivation='Be the calm you keep asking her for.', age=[2, 5], interests=[], source='Siegel & Bryson, No-Drama Discipline (2014)'),
    19: dict(moment='play', slot='block', motivation='Let her be the expert for once.', age=[3, 5], interests=[], source='Yogman et al., The Power of Play, AAP clinical report, Pediatrics (2018)'),
    20: dict(moment='energy before sitting', slot='block', motivation='Burn the wiggle before you ask for stillness.', age=[2, 4], interests=['music'], source='U.S. Dept. of Health and Human Services, Physical Activity Guidelines for Americans, 2nd ed. (2018)'),
    21: dict(moment='reunions and hellos', slot='anytime', motivation='Be the best part of her day, on purpose.', age=[1, 4], interests=[], source='Siegel & Bryson, The Whole-Brain Child (2011)'),
    22: dict(moment='play', slot='block', motivation='Play in a way that fills her up, not just passes time.', age=[2, 4], interests=[], source='Yogman et al., The Power of Play, AAP clinical report, Pediatrics (2018)'),
    23: dict(moment='big feelings', slot='anytime', motivation='Have one move that works in the worst minute.', age=[3, 5], interests=[], source='Siegel & Bryson, The Whole-Brain Child (2011)'),
    24: dict(moment='tantrums', slot='anytime', motivation='Solve the real problem under the meltdown.', age=[2, 4], interests=[], source='Greene, The Explosive Child (1998), lagging skills'),
    25: dict(moment='stories at bedtime', slot='close', motivation='Give her a piece of you she can keep.', age=[3, 5], interests=[], source='AAP Council on Early Childhood, Literacy Promotion, Pediatrics 134(2) (2014)'),
    26: dict(moment='presence at meals', slot='dinner', motivation='Be at the meal, not near it.', age=[2, 5], interests=[], source='AAP Council on Communications and Media, Media and Young Minds, Pediatrics 138(5) (2016)'),
    27: dict(moment='kindness', slot='block', motivation='Watch her find out giving feels good.', age=[3, 5], interests=['art'], source='Warneken & Tomasello, Science 311 (2006), altruistic helping in toddlers'),
    28: dict(moment='bedtime', slot='close', motivation='Give tomorrow a hook so bedtime can end.', age=[3, 5], interests=[], source='Mindell, Sleeping Through the Night (rev. ed. 2005)'),
    29: dict(moment='mealtime', slot='dinner', motivation='End the food fight by removing it.', age=[2, 4], interests=['cooking'], source='Satter, Child of Mine (3rd ed. 2000), division of responsibility in feeding'),
    30: dict(moment='redirecting', slot='anytime', motivation='Get unstuck without a louder no.', age=[2, 3], interests=[], source='Faber & King, How to Talk So Little Kids Will Listen (2017)'),
    31: dict(moment='tantrum prevention', slot='anytime', motivation='Prevent the blowup instead of surviving it.', age=[2, 4], interests=[], source='Greene, The Explosive Child (1998), lagging skills'),
    32: dict(moment='night fears', slot='close', motivation='Give her a night she is not scared of.', age=[3, 5], interests=['animals'], source='American Academy of Pediatrics, Understanding Childhood Fears and Anxieties, HealthyChildren.org'),
    33: dict(moment='separation and goodbyes', slot='morning', motivation='Leave without the tearful door scene.', age=[2, 4], interests=[], source='ZERO TO THREE, social-emotional development guides, 24 to 36 months (zerotothree.org)'),
    34: dict(moment='sharing', slot='anytime', motivation='Teach sharing without teaching grabbing.', age=[2, 3], interests=['cars'], source='ZERO TO THREE, social-emotional development guides, 24 to 36 months (zerotothree.org)'),
    35: dict(moment='hitting', slot='anytime', motivation='Stop the hitting without shame or yelling.', age=[2, 4], interests=['dinosaurs'], source='Sege & Siegel, Effective Discipline to Raise Healthy Children, AAP policy statement, Pediatrics 142(6) (2018)'),
    36: dict(moment='ending screen time', slot='anytime', motivation='End screen time without a war.', age=[2, 5], interests=['music'], source='AAP Council on Communications and Media, Media and Young Minds, Pediatrics 138(5) (2016)'),
    37: dict(moment='brushing teeth', slot='bath', motivation='Win the two minutes that guard the whole bedtime.', age=[2, 4], interests=['music', 'animals'], source='Davies, The Montessori Toddler (2019)'),
    38: dict(moment='leaving the house', slot='morning', motivation='Walk out on time, nobody crying.', age=[3, 5], interests=['dress-up'], source='Davies, The Montessori Toddler (2019)'),
    39: dict(moment='waiting', slot='anytime', motivation='Survive lines and waiting rooms with your dignity.', age=[3, 5], interests=[], source='Diamond & Lee, Science 333(6045) (2011), executive function'),
    40: dict(moment='a new baby coming', slot='anytime', motivation='Protect her place before the baby takes the lap.', age=[2, 4], interests=['books'], source='American Academy of Pediatrics, Preparing Your Child for a New Sibling, HealthyChildren.org'),
    41: dict(moment='making it right', slot='anytime', motivation='Teach her wrongs can be mended.', age=[3, 5], interests=['building'], source='Siegel & Bryson, No-Drama Discipline (2014)'),
    42: dict(moment='whining', slot='anytime', motivation='Keep your jaw unclenched through the whine.', age=[2, 4], interests=[], source='Faber & King, How to Talk So Little Kids Will Listen (2017)'),
    43: dict(moment='bath time', slot='bath', motivation='Get her into the bath without the carry.', age=[2, 4], interests=['water'], source='Yogman et al., The Power of Play, AAP clinical report, Pediatrics (2018)'),
    44: dict(moment='mealtime', slot='dinner', motivation='Eat one meal in peace.', age=[2, 4], interests=['cooking'], source='Satter, Child of Mine (3rd ed. 2000), division of responsibility in feeding'),
    45: dict(moment='car rides', slot='anytime', motivation='Drive without the back-seat siren.', age=[2, 4], interests=['cars', 'animals'], source='Faber & King, How to Talk So Little Kids Will Listen (2017)'),
}

FIELD_LABELS = [
    ("idea", "The idea:"),
    ("move", "Tonight's move:"),
    ("play", "Tonight's play:"),
    ("why", "Why it works:"),
]


def parse_file(path):
    text = open(path, encoding="utf-8").read()
    lessons = []
    # Split on Day headings, keep only Day blocks.
    blocks = re.split(r"^## Day \d+\s*$", text, flags=re.M)[1:]
    for block in blocks:
        head = re.search(r"\*\*Dadiosity Daily, Lesson (\d+): ([^*]+)\*\*", block)
        assert head, f"no heading in block of {path}: {block[:80]!r}"
        n = int(head.group(1))
        title = head.group(2).strip()
        heading = f"Dadiosity Daily, Lesson {n}: {title}"
        lesson = {"n": n, "title": title, "heading": heading}
        for key, label in FIELD_LABELS:
            m = re.search(r"\*\*" + re.escape(label) + r"\*\*\s*(.+?)(?=\n\n|\n\*\*|\nCore move:|\Z)", block, re.S)
            assert m, f"Day {n}: missing {label} in {path}"
            lesson[key] = " ".join(m.group(1).split())
        core = re.search(r"^Core move:\s*(.+)$", block, re.M)
        assert core, f"Day {n}: missing Core move in {path}"
        lesson["core"] = core.group(1).strip()
        puzzle = re.search(r"^Tonight's puzzle:\s*(.+)$", block, re.M)
        assert puzzle, f"Day {n}: missing Tonight's puzzle in {path}"
        lesson["puzzle"] = puzzle.group(1).strip()
        assert lesson["puzzle"].endswith("?"), f"Day {n}: puzzle is not a question in {path}"
        lesson["topics"] = TOPICS[n]
        lesson.update(META[n])
        lessons.append(lesson)
    return lessons


def main():
    all_lessons = []
    for name in FILES:
        all_lessons.extend(parse_file(os.path.join(HERE, name)))
    assert len(all_lessons) == 45, f"expected 45 lessons, got {len(all_lessons)}"
    assert [l["n"] for l in all_lessons] == list(range(1, 46)), "days not 1..45 in order"
    cores = [l["core"] for l in all_lessons]
    assert len(set(cores)) == 45, "core moves not unique"
    slots = {"dinner", "block", "bath", "close", "morning", "anytime"}
    for l in all_lessons:
        for k in ("title", "idea", "move", "play", "why", "core", "puzzle"):
            assert l[k], f"lesson {l['n']} empty {k}"
            assert "—" not in l[k] and "–" not in l[k], f"lesson {l['n']} dash in {k}"
        for k in ("moment", "slot", "motivation", "age", "interests", "source"):
            assert k in l, f"lesson {l['n']} missing metadata {k}"
        assert l["slot"] in slots, f"lesson {l['n']} bad slot {l['slot']}"
        assert len(l["age"]) == 2 and l["age"][0] < l["age"][1], f"lesson {l['n']} bad age band"
        assert l["source"], f"lesson {l['n']} empty source"
        assert l["motivation"], f"lesson {l['n']} empty motivation"
        assert isinstance(l["interests"], list), f"lesson {l['n']} interests not a list"
    payload = json.dumps(all_lessons, ensure_ascii=False, indent=1)
    js = (
        "/* Dadiosity lesson bank: 45 lessons, exported verbatim from\n"
        "   lessons-week-1-2026-10-24.md .. lessons-week-6-2026-11-03.md\n"
        "   by gen-lessons.py (SPEC-DADIO-ASK-1; full bank Nov 3, 2026).\n"
        "   Do not hand-edit lesson text; edit the bank, then re-run the\n"
        "   generator. `topics`, `moment`, `slot`, `motivation`, `age`,\n"
        "   `interests` and `source` are metadata only, never displayed\n"
        "   as lesson copy. */\n"
        "window.DADIO_LESSONS = " + payload + ";\n"
    )
    out = os.path.join(HERE, "lessons.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write(js)
    ev = os.path.join(HERE, "ask-ship-2026-10-31-evidence", "expected.json")
    with open(ev, "w", encoding="utf-8") as f:
        json.dump(all_lessons, f, ensure_ascii=False, indent=1)
    print(f"lessons.js written: {len(js)} bytes, 45 lessons, days 1..45, cores unique, no dashes, metadata complete")


if __name__ == "__main__":
    main()
