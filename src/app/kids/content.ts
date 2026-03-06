// Kids Reading App - Reading Content (Levels 1-10)
import { ReadingLevel } from './types';

export const avatarOptions = [
  { id: 'bear', emoji: '🐻', name: 'Bear' },
  { id: 'cat', emoji: '🐱', name: 'Cat' },
  { id: 'dog', emoji: '🐶', name: 'Dog' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'lion', emoji: '🦁', name: 'Lion' },
  { id: 'elephant', emoji: '🐘', name: 'Elephant' },
  { id: 'monkey', emoji: '🐵', name: 'Monkey' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly' },
  { id: 'owl', emoji: '🦉', name: 'Owl' },
];

export const badges = [
  { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '🌟', requirement: 1 },
  { id: 'word_master', name: 'Word Master', description: 'Learn 50 words', icon: '📚', requirement: 50 },
  { id: 'story_reader', name: 'Story Reader', description: 'Read 10 stories', icon: '📖', requirement: 10 },
  { id: 'level_5', name: 'Level Up!', description: 'Reach level 5', icon: '🎯', requirement: 5 },
  { id: 'level_10', name: 'Super Reader', description: 'Reach level 10', icon: '🏆', requirement: 10 },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day streak', icon: '🔥', requirement: 7 },
  { id: 'perfect_quiz', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '💯', requirement: 1 },
];

// Reading Levels 1-10 (MVP)
export const readingLevels: ReadingLevel[] = [
  // Level 1: Letter Recognition
  {
    id: 1,
    title: 'Learning Letters',
    description: 'Learn to recognize letters A-Z',
    lessons: [
      {
        id: 'l1-1',
        title: 'Letters A, B, C',
        type: 'phonics',
        content: 'A is for Apple 🍎\nB is for Ball ⚽\nC is for Cat 🐱\n\nA says "ah" like in Apple\nB says "buh" like in Ball\nC says "cuh" like in Cat',
        words: ['apple', 'ball', 'cat'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What letter makes the "ah" sound?', options: ['A', 'B', 'C'], correctAnswer: 0 },
            { id: 'q2', question: 'What is for Ball?', options: ['A', 'B', 'C'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l1-2',
        title: 'Letters D, E, F',
        type: 'phonics',
        content: 'D is for Dog 🐶\nE is for Elephant 🐘\nF is for Fish 🐟\n\nD says "duh" like in Dog\nE says "eh" like in Elephant\nF says "fuh" like in Fish',
        words: ['dog', 'elephant', 'fish'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What letter is for Dog?', options: ['D', 'E', 'F'], correctAnswer: 0 },
            { id: 'q2', question: 'What starts with F?', options: ['Dog', 'Fish', 'Elephant'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l1-3',
        title: 'My First Words',
        type: 'reading',
        content: 'I am Sam.\nI like to run.\nI like to play.',
        words: ['I', 'am', 'Sam', 'like', 'to', 'run', 'play'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What is the name in the story?', options: ['Sam', 'Tom', 'Mom'], correctAnswer: 0 },
            { id: 'q2', question: 'What does Sam like to do?', options: ['Sleep', 'Run', 'Cry'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 2: Short Vowels
  {
    id: 2,
    title: 'Short Vowels',
    description: 'Learn the sounds of a, e, i, o, u',
    lessons: [
      {
        id: 'l2-1',
        title: 'The Letter A',
        type: 'phonics',
        content: 'The letter A makes a short sound like "a" in "cat".\n\nWords with short A:\ncat, hat, mat, rat, sat, bat\n\nPractice reading:\nThe cat sat on the mat.',
        words: ['cat', 'hat', 'mat', 'rat', 'sat', 'bat'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What sound does short A make?', options: ['ay', 'a', 'ah'], correctAnswer: 1 },
            { id: 'q2', question: 'Which word has short A?', options: ['cake', 'cat', 'cape'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l2-2',
        title: 'The Letter E',
        type: 'phonics',
        content: 'The letter E makes a short sound like "e" in "bed".\n\nWords with short E:\nbed, red, led, fed, wet, jet\n\nPractice reading:\nThe red bed is soft.',
        words: ['bed', 'red', 'led', 'fed', 'wet', 'jet'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What sound does short E make?', options: ['ee', 'e', 'eh'], correctAnswer: 1 },
            { id: 'q2', question: 'Which word has short E?', options: ['bed', 'bead', 'bee'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l2-3',
        title: 'A Small Story',
        type: 'reading',
        content: 'Dan has a red van.\nThe van can go.\nDan can run.\nRun, Dan, run!',
        words: ['Dan', 'red', 'van', 'go', 'run'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What color is the van?', options: ['Red', 'Blue', 'Green'], correctAnswer: 0 },
            { id: 'q2', question: 'What can Dan do?', options: ['Sleep', 'Run', 'Cry'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 3: More Vowels
  {
    id: 3,
    title: 'More Vowels',
    description: 'Learn short i, o, and u',
    lessons: [
      {
        id: 'l3-1',
        title: 'Short I and O',
        type: 'phonics',
        content: 'Short I sounds like "i" in "pig".\nShort O sounds like "o" in "hot".\n\nWords with short I:\npig, big, dig, wig, sit, kit\n\nWords with short O:\nhot, pot, lot, dot, not, got',
        words: ['pig', 'big', 'hot', 'pot', 'sit', 'kit'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What sound does short I make?', options: ['eye', 'i', 'ee'], correctAnswer: 1 },
            { id: 'q2', question: 'Which word has short O?', options: ['home', 'hot', 'hole'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l3-2',
        title: 'Short U',
        type: 'phonics',
        content: 'Short U sounds like "u" in "cup".\n\nWords with short U:\ncup, pup, run, sun, fun, bun\n\nPractice reading:\nThe pup can run.\nThe sun is hot.\nIt is fun!',
        words: ['cup', 'pup', 'run', 'sun', 'fun', 'bun'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What sound does short U make?', options: ['you', 'u', 'oo'], correctAnswer: 1 },
            { id: 'q2', question: 'Which word has short U?', options: ['cup', 'cube', 'cute'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l3-3',
        title: 'A Fun Day',
        type: 'reading',
        content: 'It is a sunny day.\nI have a red cup.\nMy pup can run.\nWe can have fun!',
        words: ['sunny', 'cup', 'pup', 'run', 'fun'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What kind of day is it?', options: ['Rainy', 'Sunny', 'Snowy'], correctAnswer: 1 },
            { id: 'q2', question: 'What do we have?', options: ['Cat', 'Pup', 'Dog'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 4: CVC Words
  {
    id: 4,
    title: 'CVC Words',
    description: 'Consonant-Vowel-Consonant patterns',
    lessons: [
      {
        id: 'l4-1',
        title: 'CVC Patterns',
        type: 'phonics',
        content: 'CVC words have a consonant, vowel, then consonant.\nEach sound is clear.\n\nExamples:\ncat, dog, sun, pig, cup, bed\n\nLets blend the sounds:\nc-a-t = cat\nd-o-g = dog\ns-u-n = sun',
        words: ['cat', 'dog', 'sun', 'pig', 'cup', 'bed'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What is CVC?', options: ['Consonant Vowel Consonant', 'Cat Very Cute', 'Can Vote Now'], correctAnswer: 0 },
            { id: 'q2', question: 'Which is a CVC word?', options: ['play', 'cat', 'tree'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l4-2',
        title: 'More CVC Words',
        type: 'phonics',
        content: 'Lets practice more CVC words!\n\nbad, sad, mad\nhop, pop, top\nleg, beg, peg\n\nReading is fun!',
        words: ['bad', 'sad', 'mad', 'hop', 'pop', 'top'],
        quiz: {
          questions: [
            { id: 'q1', question: 'Which word rhymes with pop?', options: ['map', 'top', 'cap'], correctAnswer: 1 },
            { id: 'q2', question: 'Which is a CVC word?', options: ['jump', 'bed', 'blue'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l4-3',
        title: 'The Fat Cat',
        type: 'reading',
        content: 'The cat is fat.\nThe cat can sit.\nThe cat is not mad.\nThe cat is glad!',
        words: ['fat', 'cat', 'sit', 'mad', 'glad'],
        quiz: {
          questions: [
            { id: 'q1', question: 'How is the cat?', options: ['Thin', 'Fat', 'Small'], correctAnswer: 1 },
            { id: 'q2', question: 'What can the cat do?', options: ['Run', 'Sit', 'Jump'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 5: Sight Words
  {
    id: 5,
    title: 'Sight Words',
    description: 'Learn common words by sight',
    lessons: [
      {
        id: 'l5-1',
        title: 'Basic Sight Words',
        type: 'sight-words',
        content: 'These words you should know by sight!\nThey appear in almost every book.\n\nthe, is, it, to, a, an\nand, but, or, so, on, in\n\nPractice reading these words every day!',
        words: ['the', 'is', 'it', 'to', 'a', 'an', 'and', 'but', 'or', 'so', 'on', 'in'],
        quiz: {
          questions: [
            { id: 'q1', question: 'Which is a sight word?', options: ['apple', 'the', 'cat'], correctAnswer: 1 },
            { id: 'q2', question: 'How should you learn these words?', options: ['Sound them out', 'Know them by sight', 'Skip them'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l5-2',
        title: 'More Sight Words',
        type: 'sight-words',
        content: 'More sight words to learn:\n\nwas, were, have, has, had\nsaid, came, made\n\nYou, your, I, my, we, us\nat, be, this, that, from',
        words: ['was', 'were', 'have', 'has', 'had', 'said', 'came', 'made', 'you', 'your', 'I', 'my', 'we', 'us'],
        quiz: {
          questions: [
            { id: 'q1', question: 'Which is NOT a sight word?', options: ['the', 'apple', 'was'], correctAnswer: 1 },
            { id: 'q2', question: 'How many sight words were in this lesson?', options: ['5', '10', '20'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l5-3',
        title: 'The Best Day',
        type: 'reading',
        content: 'It was the best day.\nI came to the park.\nWe had fun.\nYou and I played.',
        words: ['was', 'best', 'day', 'came', 'park', 'had', 'fun', 'played'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What kind of day was it?', options: ['Worst', 'Best', 'Rainy'], correctAnswer: 1 },
            { id: 'q2', question: 'Where did they go?', options: ['School', 'Park', 'Store'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 6: Blends
  {
    id: 6,
    title: 'Consonant Blends',
    description: 'Learn consonant blend sounds',
    lessons: [
      {
        id: 'l6-1',
        title: 'Beginning Blends',
        type: 'phonics',
        content: 'Blends are two or more consonants together.\nEach sound can be heard!\n\nbl-: blue, black, blob\ncl-: clap, clock, cloud\nfl-: flag, fly, flop\ngr-: green, grapes, grass',
        words: ['blue', 'black', 'clap', 'clock', 'flag', 'fly', 'green', 'grapes'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What blend is in blue?', options: ['cl', 'bl', 'fl'], correctAnswer: 1 },
            { id: 'q2', question: 'What blend is in clock?', options: ['cl', 'gr', 'fl'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l6-2',
        title: 'More Blends',
        type: 'phonics',
        content: 'More blends to learn:\n\ndr-: drum, drip, drive\ntr-: tree, trip, truck\npr-: pray, pried, prize\nbr-: brick, brown, brush',
        words: ['drum', 'drive', 'tree', 'trip', 'truck', 'pray', 'brick', 'brown'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What blend is in truck?', options: ['tr', 'dr', 'pr'], correctAnswer: 0 },
            { id: 'q2', question: 'What blend is in brown?', options: ['br', 'gr', 'cr'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l6-3',
        title: 'The Big Truck',
        type: 'reading',
        content: 'I see a big truck.\nIt is green and brown.\nThe truck can go.\nLook at the truck!',
        words: ['truck', 'green', 'brown', 'look'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What do you see?', options: ['Car', 'Truck', 'Bike'], correctAnswer: 1 },
            { id: 'q2', question: 'What color is the truck?', options: ['Red', 'Blue', 'Green and Brown'], correctAnswer: 2 },
          ]
        }
      }
    ]
  },
  // Level 7: Digraphs
  {
    id: 7,
    title: 'Digraphs',
    description: 'Learn digraph sounds (sh, th, ch, wh)',
    lessons: [
      {
        id: 'l7-1',
        title: 'Sh and Ch',
        type: 'phonics',
        content: 'Digraphs are two letters that make one sound.\n\nsh- makes the "sh" sound:\nship, shell, shop, shut\n\nch- makes the "ch" sound:\nchin, chest, chain, chop',
        words: ['ship', 'shell', 'shop', 'chin', 'chest', 'chain', 'chop'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What digraph is in ship?', options: ['ch', 'sh', 'th'], correctAnswer: 1 },
            { id: 'q2', question: 'What digraph is in chin?', options: ['ch', 'sh', 'wh'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l7-2',
        title: 'Th and Wh',
        type: 'phonics',
        content: 'More digraphs!\n\nth- makes the "th" sound:\nthe, that, this, then\n\nwh- makes the "wh" sound:\nwhen, what, why, where',
        words: ['the', 'that', 'this', 'when', 'what', 'why', 'where'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What digraph is in this?', options: ['th', 'sh', 'ch'], correctAnswer: 0 },
            { id: 'q2', question: 'What digraph is in when?', options: ['wh', 'th', 'ch'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l7-3',
        title: 'The Fish Shop',
        type: 'reading',
        content: 'I went to the fish shop.\nThe fish is in the shop.\nThis fish is big.\nI like fish!',
        words: ['fish', 'shop', 'this', 'that', 'went'],
        quiz: {
          questions: [
            { id: 'q1', question: 'Where did they go?', options: ['Store', 'Fish Shop', 'Park'], correctAnswer: 1 },
            { id: 'q2', question: 'What is big?', options: ['Shop', 'Fish', 'Cat'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 8: Long Vowels
  {
    id: 8,
    title: 'Long Vowels',
    description: 'Learn vowel sounds when vowels say their name',
    lessons: [
      {
        id: 'l8-1',
        title: 'Long A and E',
        type: 'phonics',
        content: 'Long vowels say their name!\n\nLong A (a_e or ai):\ncake, make, take, rain, pain\n\nLong E (e_e or ee):\nfeet, see, tree, bee, green',
        words: ['cake', 'make', 'take', 'rain', 'feet', 'see', 'tree', 'bee'],
        quiz: {
          questions: [
            { id: 'q1', question: 'How does long A sound?', options: ['a', 'ay', 'e'], correctAnswer: 1 },
            { id: 'q2', question: 'How does long E sound?', options: ['e', 'ay', 'ee'], correctAnswer: 2 },
          ]
        }
      },
      {
        id: 'l8-2',
        title: 'Long I, O, U',
        type: 'phonics',
        content: 'Long I (i_e or ie):\ntime, like, side, pie, tie\n\nLong O (o_e or oa):\nhome, note, boat, coat, road\n\nLong U (u_e):\ncube, tube, use, cute',
        words: ['time', 'like', 'home', 'note', 'boat', 'cube', 'cute'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What is the long I word?', options: ['time', 'tim', 'tam'], correctAnswer: 0 },
            { id: 'q2', question: 'What is the long O word?', options: ['hot', 'home', 'ham'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l8-3',
        title: 'A Nice Day',
        type: 'reading',
        content: 'It is a nice day.\nI like to ride my bike.\nI can see the green trees.\nWhat a nice day!',
        words: ['nice', 'day', 'ride', 'bike', 'trees', 'what'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What kind of day is it?', options: ['Bad', 'Nice', 'Rainy'], correctAnswer: 1 },
            { id: 'q2', question: 'What can they ride?', options: ['Car', 'Bike', 'Truck'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 9: R-Controlled Vowels
  {
    id: 9,
    title: 'R-Controlled Vowels',
    description: 'Learn ar, or, er, ir, ur sounds',
    lessons: [
      {
        id: 'l9-1',
        title: 'AR and OR',
        type: 'phonics',
        content: 'When a vowel is followed by R, the sound changes!\n\nAR sounds like "ar":\ncar, star, far, jar, bar\n\nOR sounds like "or":\nfor, more, door, floor, store',
        words: ['car', 'star', 'far', 'jar', 'for', 'more', 'door', 'floor'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What sound does AR make?', options: ['air', 'ar', 'or'], correctAnswer: 1 },
            { id: 'q2', question: 'What sound does OR make?', options: ['or', 'ar', 'ur'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l9-2',
        title: 'ER, IR, UR',
        type: 'phonics',
        content: 'These all sound the same!\n\nER, IR, UR sound like "er":\nher, bird, fur\nfern, sir, turn\nper, third, burn',
        words: ['her', 'bird', 'fur', 'fern', 'sir', 'turn', 'burn'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What do ER, IR, UR have in common?', options: ['Different sounds', 'Same sound', 'No sound'], correctAnswer: 1 },
            { id: 'q2', question: 'Which word has the ER sound?', options: ['car', 'bird', 'cake'], correctAnswer: 1 },
          ]
        }
      },
      {
        id: 'l9-3',
        title: 'The Farm',
        type: 'reading',
        content: 'I went to the farm.\nI see a red car.\nThe barn is far.\nIt is fun on the farm!',
        words: ['farm', 'car', 'barn', 'far', 'fun'],
        quiz: {
          questions: [
            { id: 'q1', question: 'Where did they go?', options: ['Store', 'Farm', 'Park'], correctAnswer: 1 },
            { id: 'q2', question: 'What color is the car?', options: ['Blue', 'Red', 'Green'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
  // Level 10: Review
  {
    id: 10,
    title: 'Review Level 1',
    description: 'Review everything you learned so far',
    lessons: [
      {
        id: 'l10-1',
        title: 'Mixed Practice',
        type: 'reading',
        content: 'Time to review what you learned!\n\nThe cat ran to the shop.\nIt was not far.\nThe shop has a red door.\nThe cat can see me.',
        words: ['ran', 'shop', 'far', 'door', 'see'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What ran to the shop?', options: ['Dog', 'Cat', 'Bird'], correctAnswer: 1 },
            { id: 'q2', question: 'What color is the door?', options: ['Red', 'Blue', 'Green'], correctAnswer: 0 },
          ]
        }
      },
      {
        id: 'l10-2',
        title: 'More Review',
        type: 'reading',
        content: 'Lets read together!\n\nI like to ride my bike.\nThe sun is bright.\nI can see the trees.\nWhat a nice sight!',
        words: ['ride', 'bike', 'bright', 'trees', 'sight'],
        quiz: {
          questions: [
            { id: 'q1', question: 'What do they ride?', options: ['Car', 'Bike', 'Truck'], correctAnswer: 1 },
            { id: 'q2', question: 'How is the sun?', options: ['Dark', 'Bright', 'Small'], correctAnswer: 1 },
          ]
        }
      }
    ]
  },
];
