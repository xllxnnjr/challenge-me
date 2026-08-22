import { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  challengeId?: string;
  challengeTitle?: string;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

interface Question {
  q: string;
  opts: string[];
  ans: number;
  fact: string;
  diff: Difficulty;
}

// Specialized question banks for each of the 10 trivia games
const TRIVIA_BANKS: Record<string, Question[]> = {
  trivia_lightning: [
    {
      q: 'How many bones are there in the adult human body?',
      opts: ['186 bones', '206 bones', '216 bones', '250 bones'],
      ans: 1,
      fact: 'Babies are born with ~270 bones, which fuse into 206 by adulthood!',
      diff: 'Easy',
    },
    {
      q: 'What is the fastest land animal in the world?',
      opts: ['Cheetah', 'Pronghorn', 'Lion', 'Peregrine Falcon'],
      ans: 0,
      fact: 'Cheetahs can accelerate from 0 to 60 mph in just 3 seconds!',
      diff: 'Easy',
    },
    {
      q: 'Which country invented tea around 2737 BC?',
      opts: ['India', 'China', 'Japan', 'United Kingdom'],
      ans: 1,
      fact: 'Legend says Emperor Shennong discovered tea when leaves blew into his boiling water.',
      diff: 'Medium',
    },
    {
      q: 'What is the only mammal capable of true sustained flight?',
      opts: ['Flying Squirrel', 'Sugar Glider', 'Bat', 'Colugo'],
      ans: 2,
      fact: 'Bats make up roughly 20% of all classified mammal species on Earth!',
      diff: 'Medium',
    },
    {
      q: 'What is the rarest blood type in the human population?',
      opts: ['O-Positive', 'AB-Negative', 'B-Negative', 'Rh-null ("Golden Blood")'],
      ans: 3,
      fact: 'Rh-null blood lacks all 61 Rh antigens and has been recorded in under 50 people worldwide.',
      diff: 'Hard',
    },
    {
      q: 'Which element has the highest melting point of all pure metals (3,422 °C)?',
      opts: ['Platinum', 'Tungsten', 'Titanium', 'Osmium'],
      ans: 1,
      fact: 'Tungsten (symbol W, from Wolfram) has the highest melting point of all elements except carbon.',
      diff: 'Hard',
    },
  ],

  trivia_world_capitals: [
    {
      q: 'What is the capital city of Australia?',
      opts: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
      ans: 2,
      fact: 'Canberra was chosen as the capital in 1908 as a compromise between Sydney and Melbourne.',
      diff: 'Easy',
    },
    {
      q: 'What is the largest country in South America by both area and population?',
      opts: ['Argentina', 'Brazil', 'Colombia', 'Peru'],
      ans: 1,
      fact: 'Brazil covers nearly half the entire South American continent!',
      diff: 'Easy',
    },
    {
      q: 'Which European city is famously built across 14 islands connected by 57 bridges?',
      opts: ['Amsterdam', 'Venice', 'Stockholm', 'Copenhagen'],
      ans: 2,
      fact: 'Stockholm, Sweden sits where Lake Mälaren flows into the Baltic Sea.',
      diff: 'Medium',
    },
    {
      q: 'What is the world’s highest uninterrupted waterfall?',
      opts: ['Niagara Falls', 'Victoria Falls', 'Angel Falls', 'Iguazu Falls'],
      ans: 2,
      fact: 'Angel Falls in Venezuela plunges an astounding 979 meters (3,212 feet)!',
      diff: 'Medium',
    },
    {
      q: 'Which landlocked African country has three official capital cities (Pretoria, Cape Town, Bloemfontein)?',
      opts: ['South Africa', 'Kenya', 'Zimbabwe', 'Nigeria'],
      ans: 0,
      fact: 'South Africa splits executive, legislative, and judicial branches among three separate capitals.',
      diff: 'Hard',
    },
    {
      q: 'What is the capital of Kazakhstan, formerly known as Nur-Sultan?',
      opts: ['Almaty', 'Astana', 'Tashkent', 'Bishkek'],
      ans: 1,
      fact: 'The futuristic capital was officially renamed back to Astana in September 2022.',
      diff: 'Hard',
    },
  ],

  trivia_cosmos_space: [
    {
      q: 'Which planet in our solar system is closest to the Sun?',
      opts: ['Venus', 'Mercury', 'Mars', 'Earth'],
      ans: 1,
      fact: 'Despite being closest to the Sun, Mercury is not the hottest planet—Venus is hotter due to greenhouse gases!',
      diff: 'Easy',
    },
    {
      q: 'What type of celestial object is the Sun classified as?',
      opts: ['Red Giant', 'Yellow Dwarf (G-type)', 'White Dwarf', 'Neutron Star'],
      ans: 1,
      fact: 'The Sun is a G-type main-sequence star (Yellow Dwarf) about 4.6 billion years old.',
      diff: 'Easy',
    },
    {
      q: 'In which year did humans first set foot on the Moon during Apollo 11?',
      opts: ['1965', '1969', '1971', '1975'],
      ans: 1,
      fact: 'Neil Armstrong stepped onto the lunar surface on July 20, 1969.',
      diff: 'Medium',
    },
    {
      q: 'Which planet has the Great Red Spot, a massive storm larger than Earth?',
      opts: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
      ans: 1,
      fact: 'The Great Red Spot has been raging continuously for at least 350+ years!',
      diff: 'Medium',
    },
    {
      q: 'What is the theoretical boundary around a black hole beyond which light cannot escape?',
      opts: ['Singularity', 'Event Horizon', 'Accretion Disk', 'Photon Sphere'],
      ans: 1,
      fact: 'The Event Horizon marks the point where the escape velocity strictly exceeds the speed of light.',
      diff: 'Hard',
    },
    {
      q: 'How long does sunlight take to travel 93 million miles to reach Earth?',
      opts: ['8 minutes and 20 seconds', '1 hour', '12 seconds', '3 minutes and 15 seconds'],
      ans: 0,
      fact: 'Photons created in the Sun’s core take ~100,000 years to reach the surface, but only 8m 20s to hit Earth!',
      diff: 'Hard',
    },
  ],

  trivia_tech_innovators: [
    {
      q: 'What does "HTTP" stand for in web internet architecture?',
      opts: [
        'HyperText Transfer Protocol',
        'High Throughput Terminal Process',
        'Hyperlink Terminal Target Path',
        'Host Transmission Text Program',
      ],
      ans: 0,
      fact: 'Tim Berners-Lee designed HTTP at CERN in 1989 as the foundation of the World Wide Web.',
      diff: 'Easy',
    },
    {
      q: 'Which operating system mascot is a penguin named Tux?',
      opts: ['macOS', 'Windows', 'Linux', 'FreeBSD'],
      ans: 2,
      fact: 'Linus Torvalds chose a penguin after being playfully nipped by one at an Australian zoo!',
      diff: 'Easy',
    },
    {
      q: 'Who is recognized as having written the first computer algorithm in 1843?',
      opts: ['Alan Turing', 'Ada Lovelace', 'Grace Hopper', 'John von Neumann'],
      ans: 1,
      fact: 'Ada Lovelace published notes describing how Babbage’s engine could compute Bernoulli numbers.',
      diff: 'Medium',
    },
    {
      q: 'In what year was the original iPhone unveiled by Steve Jobs?',
      opts: ['2005', '2007', '2009', '2011'],
      ans: 1,
      fact: 'Steve Jobs introduced it as three products in one: an iPod, a phone, and an internet communicator.',
      diff: 'Medium',
    },
    {
      q: 'What does the "GPT" acronym stand for in contemporary AI models?',
      opts: [
        'Generative Pre-trained Transformer',
        'General Purpose Technology',
        'Guided Program Tokenizer',
        'Gradient Processing Tree',
      ],
      ans: 0,
      fact: 'The Transformer architecture was first introduced in Google’s seminal 2017 paper "Attention Is All You Need".',
      diff: 'Hard',
    },
    {
      q: 'Which programming language was originally created in just 10 days by Brendan Eich in 1995?',
      opts: ['Python', 'JavaScript', 'Ruby', 'PHP'],
      ans: 1,
      fact: 'Originally codenamed Mocha, then LiveScript, it was finally branded JavaScript.',
      diff: 'Hard',
    },
  ],

  trivia_ancient_history: [
    {
      q: 'Which river was the lifeblood of Ancient Egyptian civilization?',
      opts: ['Tigris', 'Euphrates', 'Nile River', 'Amazon River'],
      ans: 2,
      fact: 'The annual flooding of the Nile deposited nutrient-rich black silt, enabling fertile agriculture.',
      diff: 'Easy',
    },
    {
      q: 'Who was the famous first Emperor of the unified Roman Empire?',
      opts: ['Julius Caesar', 'Augustus Caesar', 'Nero', 'Marcus Aurelius'],
      ans: 1,
      fact: 'Born Gaius Octavius, Augustus founded the Roman Principate in 27 BC.',
      diff: 'Easy',
    },
    {
      q: 'Which ancient civilization built the magnificent city of Machu Picchu in the Andes mountains?',
      opts: ['Aztec Empire', 'Maya Civilization', 'Inca Empire', 'Olmec Culture'],
      ans: 2,
      fact: 'Machu Picchu was constructed around 1450 AD at an elevation of 7,970 feet (2,430 meters).',
      diff: 'Medium',
    },
    {
      q: 'The Code of Hammurabi, one of the earliest legal codes, originated in which ancient civilization?',
      opts: ['Babylon (Mesopotamia)', 'Ancient Greece', 'Persia', 'Egypt'],
      ans: 0,
      fact: 'King Hammurabi inscribed 282 laws onto a 7-foot diorite stele around 1754 BC.',
      diff: 'Medium',
    },
    {
      q: 'In which year did the Western Roman Empire traditionally fall with the deposition of Romulus Augustulus?',
      opts: ['312 AD', '410 AD', '476 AD', '1453 AD'],
      ans: 2,
      fact: 'Germanic chieftain Odoacer deposed the last western emperor Romulus Augustulus in 476 AD.',
      diff: 'Hard',
    },
    {
      q: 'Which of the Seven Wonders of the Ancient World is the only one still standing today?',
      opts: [
        'Colossus of Rhodes',
        'Great Pyramid of Giza',
        'Lighthouse of Alexandria',
        'Hanging Gardens of Babylon',
      ],
      ans: 1,
      fact: 'Built around 2560 BC for Pharaoh Khufu, the Great Pyramid stood as the tallest man-made structure for over 3,800 years!',
      diff: 'Hard',
    },
  ],

  trivia_nature_wildlife: [
    {
      q: 'What is the largest living animal on planet Earth?',
      opts: ['African Elephant', 'Blue Whale', 'Colossal Squid', 'Whale Shark'],
      ans: 1,
      fact: 'A Blue Whale can weigh up to 200 tons (equivalent to ~33 elephants) with a heart the size of a golf cart!',
      diff: 'Easy',
    },
    {
      q: 'How many legs does an arachnid (such as a spider or scorpion) have?',
      opts: ['6 legs', '8 legs', '10 legs', '12 legs'],
      ans: 1,
      fact: 'Insects have 6 legs, whereas all arachnids possess 8 legs (4 pairs)!',
      diff: 'Easy',
    },
    {
      q: 'How many hearts does an octopus possess in its body?',
      opts: ['1 Heart', '2 Hearts', '3 Hearts', '4 Hearts'],
      ans: 2,
      fact: 'Two hearts pump blood to the gills, while the third circulates oxygenated blood through the body!',
      diff: 'Medium',
    },
    {
      q: 'What unique pigment gives flamingos their vibrant pink coloration?',
      opts: ['Melanin', 'Chlorophyll', 'Carotenoids from algae & shrimp', 'Anthocyanin'],
      ans: 2,
      fact: 'Flamingos are born grey; their pink feathers develop from beta-carotene in their brine shrimp diet.',
      diff: 'Medium',
    },
    {
      q: 'Which immortal creature is biologically capable of reverting back to its polyp state indefinitely?',
      opts: ['Axolotl', 'Turritopsis dohrnii (Jellyfish)', 'Tardigrade', 'Hydra vulgaris'],
      ans: 1,
      fact: 'Turritopsis dohrnii can reset its cellular lifecycle when stressed through transdifferentiation.',
      diff: 'Hard',
    },
    {
      q: 'What microscopic animal can survive the vacuum of outer space, absolute zero, and radiation?',
      opts: ['Nematode', 'Tardigrade (Water Bear)', 'Rotifer', 'Planarian'],
      ans: 1,
      fact: 'Tardigrades enter cryptobiosis, shedding 99% of their moisture to survive decades in harsh environments.',
      diff: 'Hard',
    },
  ],

  trivia_cinema_hollywood: [
    {
      q: 'Which movie won Best Picture and famously popularized the quote "May the Force be with you"?',
      opts: ['Star Wars', 'Star Trek', 'E.T.', 'Blade Runner'],
      ans: 0,
      fact: 'Star Wars: A New Hope debuted in 1977 and revolutionized film visual effects forever.',
      diff: 'Easy',
    },
    {
      q: 'Who played the iconic role of Jack Dawson in James Cameron’s 1997 epic "Titanic"?',
      opts: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Johnny Depp'],
      ans: 1,
      fact: 'Titanic won 11 Academy Awards, tied for the most Oscars won by a single film in history.',
      diff: 'Easy',
    },
    {
      q: 'Which director is known for "Inception", "The Dark Knight Trilogy", "Oppenheimer", and "Interstellar"?',
      opts: ['Steven Spielberg', 'Christopher Nolan', 'Denis Villeneuve', 'Martin Scorsese'],
      ans: 1,
      fact: 'Christopher Nolan is renowned for prioritizing practical effects over CGI whenever possible.',
      diff: 'Medium',
    },
    {
      q: 'In "The Matrix" (1999), which color pill does Neo take to wake up to reality?',
      opts: ['Blue Pill', 'Red Pill', 'Green Pill', 'Gold Pill'],
      ans: 1,
      fact: 'Morpheus explains: "You take the red pill, you stay in Wonderland, and I show you how deep the rabbit hole goes."',
      diff: 'Medium',
    },
    {
      q: 'Which film holds the record for the highest worldwide box office gross of all time ($2.9B+)?',
      opts: ['Avengers: Endgame', 'Avatar (2009)', 'Titanic', 'Star Wars: The Force Awakens'],
      ans: 1,
      fact: 'James Cameron’s Avatar became the first film to cross the $2 billion mark.',
      diff: 'Hard',
    },
    {
      q: 'Who composed the unforgettable scores for "Jaws", "Star Wars", "Jurassic Park", and "Indiana Jones"?',
      opts: ['Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Howard Shore'],
      ans: 1,
      fact: 'John Williams has received 54 Academy Award nominations, the most of any living individual!',
      diff: 'Hard',
    },
  ],

  trivia_music_legends: [
    {
      q: 'Which legendary British band was composed of John, Paul, George, and Ringo?',
      opts: ['The Rolling Stones', 'The Beatles', 'Queen', 'The Who'],
      ans: 1,
      fact: 'The Beatles have sold an estimated 600 million+ records worldwide, the most in music history.',
      diff: 'Easy',
    },
    {
      q: 'Who is widely recognized as the "King of Pop"?',
      opts: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Freddie Mercury'],
      ans: 1,
      fact: 'Michael Jackson’s 1982 album "Thriller" remains the best-selling album of all time (~70M copies).',
      diff: 'Easy',
    },
    {
      q: 'Which artist released the groundbreaking visual albums "Lemonade" and "Renaissance"?',
      opts: ['Rihanna', 'Beyoncé', 'Taylor Swift', 'Adele'],
      ans: 1,
      fact: 'Beyoncé is the most awarded artist in Grammy history with over 32 Grammy trophies!',
      diff: 'Medium',
    },
    {
      q: 'What is the musical term for gradually getting louder in volume?',
      opts: ['Decrescendo', 'Crescendo', 'Staccato', 'Legato'],
      ans: 1,
      fact: 'Crescendo comes from the Italian word "crescere", meaning to grow or increase.',
      diff: 'Medium',
    },
    {
      q: 'Which classical composer wrote the famous "Symphony No. 9 (Ode to Joy)" while completely deaf?',
      opts: ['Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Johann Sebastian Bach', 'Frédéric Chopin'],
      ans: 1,
      fact: 'Beethoven had to be turned around by a performer at the premiere so he could see the roaring standing ovation!',
      diff: 'Hard',
    },
    {
      q: 'Which legendary rock festival took place in Bethel, New York in August 1969 with 400,000+ attendees?',
      opts: ['Glastonbury', 'Woodstock Music & Art Fair', 'Monterey Pop', 'Isle of Wight'],
      ans: 1,
      fact: 'Woodstock was originally planned as a paid festival, but fencing collapsed and it became free to the public.',
      diff: 'Hard',
    },
  ],

  trivia_mythology_gods: [
    {
      q: 'In Greek mythology, who is the King of the Gods and wielder of the thunderbolt?',
      opts: ['Poseidon', 'Hades', 'Zeus', 'Ares'],
      ans: 2,
      fact: 'Zeus ruled Mount Olympus and was the youngest son of the Titans Cronus and Rhea.',
      diff: 'Easy',
    },
    {
      q: 'In Norse mythology, what is the name of Thor’s enchanted lightning hammer?',
      opts: ['Excalibur', 'Mjölnir', 'Gungnir', 'Gram'],
      ans: 1,
      fact: 'Mjölnir was crafted by the dwarven brothers Brokkr and Eitri and could level mountains.',
      diff: 'Easy',
    },
    {
      q: 'Who was the ancient Egyptian god of the underworld and afterlife, usually depicted with green skin?',
      opts: ['Anubis', 'Ra', 'Osiris', 'Horus'],
      ans: 2,
      fact: 'Osiris’ green skin symbolized rebirth, vegetation, and fertility along the Nile.',
      diff: 'Medium',
    },
    {
      q: 'In Greek myth, which hero was immortal except for his vulnerable heel?',
      opts: ['Hercules', 'Perseus', 'Achilles', 'Theseus'],
      ans: 2,
      fact: 'His mother Thetis dipped him in the River Styx while holding him tightly by his heel.',
      diff: 'Medium',
    },
    {
      q: 'In Norse cosmology, what is the colossal sacred ash tree connecting the nine realms called?',
      opts: ['Yggdrasil', 'Bifröst', 'Valhalla', 'Niflheim'],
      ans: 0,
      fact: 'Yggdrasil’s branches extend high into the heavens, while its three roots reach into three distinct wells.',
      diff: 'Hard',
    },
    {
      q: 'In Roman mythology, which goddess is the equivalent of the Greek goddess of love, Aphrodite?',
      opts: ['Minerva', 'Juno', 'Venus', 'Diana'],
      ans: 2,
      fact: 'Venus was also considered the mythical ancestress of the Roman people through her son Aeneas.',
      diff: 'Hard',
    },
  ],

  trivia_world_culinary: [
    {
      q: 'Which country is the birthplace of pizza, specifically the classic Margherita style from Naples?',
      opts: ['Greece', 'Italy', 'France', 'Spain'],
      ans: 1,
      fact: 'Pizza Margherita was created in 1889 featuring tomato, mozzarella, and basil to represent the Italian flag!',
      diff: 'Easy',
    },
    {
      q: 'What is the primary ingredient in traditional Japanese guacamole or sushi wasabi paste?',
      opts: ['Avocado', 'Wasabia japonica (Japanese horseradish)', 'Green mustard', 'Spinach'],
      ans: 1,
      fact: 'Real wasabi stem is grated fresh on sharkskin boards to release volatile aromatic vapors.',
      diff: 'Easy',
    },
    {
      q: 'Which precious spice, harvested from the purple crocus flower stigmas, is the most expensive in the world?',
      opts: ['Vanilla', 'Saffron', 'Cardamom', 'Cinnamon'],
      ans: 1,
      fact: 'It takes roughly 75,000 crocus flowers to yield just one pound of dried saffron threads!',
      diff: 'Medium',
    },
    {
      q: 'What chemical compound is responsible for the fiery heat in spicy chili peppers?',
      opts: ['Capsaicin', 'Piperine', 'Glucosinolate', 'Allicin'],
      ans: 0,
      fact: 'Capsaicin binds to TRPV1 heat-sensing nerve receptors on the tongue, tricking the brain into feeling heat.',
      diff: 'Medium',
    },
    {
      q: 'What is the culinary chemical reaction between amino acids and reducing sugars that creates browning and rich flavor?',
      opts: ['Caramelization', 'The Maillard Reaction', 'Fermentation', 'Oxidation'],
      ans: 1,
      fact: 'Discovered by French chemist Louis-Camille Maillard in 1912, it gives seared steaks, crusty bread, and toasted coffee their distinct aroma.',
      diff: 'Hard',
    },
    {
      q: 'Which French pastry dough is known for its "thousand leaves" created by repeatedly laminating butter into dough?',
      opts: ['Pâte à Choux', 'Mille-Feuille (Puff Pastry)', 'Brioche', 'Shortcrust'],
      ans: 1,
      fact: 'A standard laminated puff pastry block can contain up to 729 ultra-thin alternating layers of butter and dough!',
      diff: 'Hard',
    },
  ],
};

export function TriviaGame({
  difficulty,
  challengeId = 'trivia_lightning',
  challengeTitle = 'Trivia Quiz',
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  // Select matching pool for this specific challenge or fallback to lightning
  const challengePool = TRIVIA_BANKS[challengeId] || TRIVIA_BANKS.trivia_lightning;

  const [question, setQuestion] = useState<Question>(challengePool[0]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const matching = challengePool.filter((q) => q.diff === difficulty);
    const pool = matching.length > 0 ? matching : challengePool;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    setQuestion(randomQ);
    setSelectedIdx(null);
  }, [difficulty, challengeId]);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);

    if (idx === question.ans) {
      const basePts = difficulty === 'Easy' ? 35 : difficulty === 'Medium' ? 50 : 70;
      sound.playSuccess(soundEnabled);
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);

      setTimeout(() => {
        onSuccess(basePts, `💡 Brilliant Knowledge! ${question.fact}`);
      }, 600);
    } else {
      sound.playError(soundEnabled);
      setStreak(0);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Incorrect trivia answer');
      onErrorToast(`Incorrect! Expected "${question.opts[question.ans]}". -${penaltyAmount} pts.`);

      setTimeout(() => {
        const pool = challengePool.filter((q) => q.diff === difficulty && q.q !== question.q);
        setQuestion(pool[Math.floor(Math.random() * pool.length)] || challengePool[0]);
        setSelectedIdx(null);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-700/50 text-pink-200 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{challengeTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {streak > 1 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 border border-amber-400 text-amber-300 animate-pulse">
              {streak}x Streak 🔥
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-pink-300">
            {difficulty} Tier
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-black/40 border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-4 shadow-xl text-left backdrop-blur-md">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
            Trivia Challenge
          </span>
          <span className="text-[10px] text-slate-400 font-mono">1-Tap Selection</span>
        </div>
        <h3 className="font-display font-extrabold text-white text-base sm:text-lg leading-snug">
          {question.q}
        </h3>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {question.opts.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          let style = 'bg-[#131d33] hover:bg-[#1a2846] border-[#293856] text-white';

          if (selectedIdx !== null) {
            if (idx === question.ans) {
              style = 'bg-emerald-900/90 border-emerald-400 text-emerald-100 shadow-md ring-1 ring-emerald-400';
            } else if (idx === selectedIdx) {
              style = 'bg-rose-950/90 border-rose-500 text-rose-200 ring-1 ring-rose-500';
            } else {
              style = 'bg-[#0d1424] border-[#1f2a42] opacity-40 text-slate-400';
            }
          }

          return (
            <button
              key={opt}
              type="button"
              disabled={selectedIdx !== null}
              onClick={() => handleSelect(idx)}
              className={`p-3.5 rounded-xl border font-bold text-xs sm:text-sm text-left transition-all active:scale-98 flex items-center justify-between cursor-pointer ${style}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black text-amber-300 shrink-0">
                  {letter}
                </span>
                <span className="truncate">{opt}</span>
              </div>
              {selectedIdx !== null && idx === question.ans && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
              )}
              {selectedIdx !== null && idx === selectedIdx && idx !== question.ans && (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Educational Fact Banner upon answer */}
      {selectedIdx !== null && (
        <div className="w-full mt-3.5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-left text-xs text-indigo-200 animate-in fade-in duration-200 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-display">Did you know?</strong>
            <span>{question.fact}</span>
          </div>
        </div>
      )}
    </div>
  );
}

