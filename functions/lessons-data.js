// Dadiosity Daily lesson store -- Lessons 1 to 7.
//
// Source: the Week 1 lesson bank Billy approved as staged content
// (~/workspace/builds/dadiosity/lessons-week-1-2026-10-24.md).
// Text is transcribed word for word from that bank. Formatting only:
// the bank's bold labels become plain labels here. Nothing is rewritten,
// added, or invented. If a dad's next lesson number is past the end of
// this list, the sender sends nothing that day (no repeats, no filler).

export const LESSONS = [
  {
    n: 1,
    theme: "Get Down Low",
    idea: "Your kid hears you best when you are close. Standing tall makes your voice feel far away. Getting low makes it near and calm. Small kids read your face more than your words.",
    move: "Tonight, pick one moment at home, like greeting time or dinner time. Get down on one knee or sit on the floor. Come to her eye level. Say her name, wait for her eyes, then speak.",
    play: "Sit on the floor with a soft ball. Roll it to her and wait. When she rolls it back, cheer like it is a big win. Let the game stay slow and silly.",
    why: "A close face feels safe, and safe kids listen better. Eye level also slows you down. That calm is the first lesson she copies from you.",
    core: "get to eye level before you speak."
  },
  {
    n: 2,
    theme: "Name It First",
    idea: "When feelings get big, your kid has no words for them yet. If you name the feeling first, she does not have to shout to be known.",
    move: "At dinner or bath time, when she gets upset, name it before you fix it. Say, you are mad. You wanted more. Then wait a beat before you help.",
    play: "Stand at a mirror together. Make a happy face, a sad face, and a mad face. Name each one out loud. Let her pick the next face for you to make.",
    why: "Words give a feeling a smaller shape. A named feeling is easier to hold. She learns the words by hearing them at the moment she needs them most.",
    core: "name the feeling before you fix the problem."
  },
  {
    n: 3,
    theme: "Warn Before the Switch",
    idea: "Hard moments often come at a switch. Play stops, dinner starts, or the bath ends. A sudden switch can feel like a loss. A fair warning makes it easier.",
    move: "Tonight, warn her two times before each switch. Say, two more minutes, then we wash hands. Say it once more at one minute. Then follow through, calm and kind.",
    play: "Practice the switch as a game. Send a stuffed bear down a slide made of books. Count down out loud together. Clap when the bear lands and the turn ends.",
    why: "A warning gives her mind time to move. Time to move means fewer tears at the edge. She trusts the switch when it is not a surprise.",
    core: "warn two times before a change, then follow through."
  },
  {
    n: 4,
    theme: "Say What You See",
    idea: "Your kid learns words from your voice all day long. You do not need a special lesson time for that. Plain talk during small moments does the work.",
    move: "At bath time tonight, say what you see in short lines. Warm water. Blue cup. Wet toes. Pause after each line so she can try a word back to you.",
    play: "Stack blocks together and talk through each one. Red block on top. Big block falls down. Laugh, build it again, and keep the words just as plain as that.",
    why: "Kids copy words they hear at the moment the words fit. Short lines are easy to grab and try. Your calm voice turns plain time into word time.",
    core: "narrate small moments in short, plain lines."
  },
  {
    n: 5,
    theme: "Fix It Fast",
    idea: "You will snap some days. Every dad does. What lasts is not the snap on its own. What lasts is how fast you come back and make it right.",
    move: "If you raise your voice tonight, stop as soon as you can. Take one slow breath. Get low, say you are sorry, and name what you did. Then hug or sit close.",
    play: "Pretend to bump a stuffed bear by mistake. Say sorry to the bear together. Give it a hug and a bandage made of cloth. Let her lead the care.",
    why: "A quick fix shows her that love comes back after a hard moment. She learns that a bad moment can still end well. That lesson shapes how she fixes things too.",
    core: "after you snap, stop, say sorry, and reconnect fast."
  },
  {
    n: 6,
    theme: "Same Steps at Bedtime",
    idea: "Bedtime goes better when the end of the day feels known. Same steps, in the same order, tell her body what comes next. New tricks each night do the opposite.",
    move: "Pick three steps tonight and keep the order fixed. Bath, book, then song works well. Say each step as you start it. Do not add a fourth step when she asks for more.",
    play: "Put a stuffed bear to bed before her turn comes. A bath in a toy tub, one short book, one short song. Use the same order you will use for her.",
    why: "A known order feels safe at night. Safe kids settle with less fight in them. She can rest because she knows the road home to sleep.",
    core: "keep the same three bedtime steps in the same order."
  },
  {
    n: 7,
    theme: "End on One Good Thing",
    idea: "The last words of the day tend to stick. If the day ends on a hard note, it can color the whole day. One good moment, named out loud, can hold the day well.",
    move: "At bedtime tonight, name one good moment from the day. Keep it small and true. Say yours first, then ask for hers. Take any answer she gives, even a short one.",
    play: "Act out the good moment with two stuffed animals. Keep it short and a bit silly. Let her pick which animal plays her part in it. End the show with a cheer.",
    why: "Naming the good trains the mind to go and find it. Kids sleep well after a warm last thought. You will carry that same good moment into your night too.",
    core: "name one true good moment as the last thing at bedtime."
  }
];

export function subjectFor(lesson) {
  return "Dadiosity Daily, Lesson " + lesson.n + ": " + lesson.theme;
}
