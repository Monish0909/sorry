// ─────────────────────────────────────────────────────────────
//  Sab text yahin hai. Koi bhi line badalni ho toh sirf yahan badlo.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  herName: "Lapodi",
  yourName: "Monish",

  // YouTube video ID of the song (the part after "watch?v="). Leave "" for no music.
  songYouTubeId: "",
  songStartSeconds: 0,

  // WhatsApp number with country code, no "+" or spaces. e.g. "919876543210".
  // Leave "" and the final button just shows a soft message instead.
  whatsappNumber: "",
  whatsappText: "Maine sab dekh liya. Baat karte hain?",
};

// Each stop = one place in the room. `steps` are shown one by one (Aage button).
export const STOPS = [
  {
    id: "door",
    eyebrow: "Siya ke liye",
    title: "Lapodi, ye jagah sirf tumhare liye hai.",
    steps: [
      "Main kuch kehna chahta hoon — wo, jo main aksar bol nahi paata. Isliye ye room banaya hai. Aaram se, ek ek cheez dekhte hue chalo.",
    ],
    next: "Chalo",
  },
  {
    id: "photos",
    eyebrow: "Deewar par",
    title: "Hum.",
    steps: [
      "Ye hum hain.",
      "Mujhe ye saari tasveerein bahut pyaari hain.",
      "Kisi bhi photo ko dabao — bada karke dekho.",
    ],
    next: "Aage",
  },
  {
    id: "letter",
    eyebrow: "Desk par rakhi chitthi",
    title: "Ek chitthi",
    letter: true,
    steps: [
      `<p>Lapodi,</p>
       <p>Main jaanta hoon ki main wahi galtiyan baar baar karta hoon, aur har baar tumhe hurt karta hoon. Maine kabhi tumhe hurt karna nahi chaha, par asar intention se zyada matter karta hai — aur main wo asar dekh raha hoon.</p>
       <p>Kabhi kabhi mujhe tum par gussa aa jata hai. Wo galat hai, aur ab main use tum par nahi nikalunga.</p>
       <p>Main shy hoon, aur kai baar boring bhi. Tumhari wo chulbuli, khelti hui side ko main jagah hi nahi de paata. Main nahi chahta ki meri wajah se wo side dab jaye.</p>
       <p>Aur sabse badi baat: main tumse pyaar karta hoon, bas bolta nahi. Aaj bol raha hoon.</p>
       <p class="sign">— Monish</p>`,
    ],
    next: "Aage",
  },
  {
    id: "unsaid",
    eyebrow: "Khidki ke paas",
    title: "Jo main bolta nahi",
    steps: [
      "<em>Jab tum meri taraf dekhti ho</em> — mujhe tumhari aankhein bahut pasand hain.",
      "<em>Jab tum hasti ho, khelti ho</em> — tum mujhe sach mein pari jaisi lagti ho.",
      "<em>Jab tum chulbuli harkatein karti ho</em> — wo mujhe bahut pasand hain.",
      "Ye sab main kabhi bolta nahi. Bolna chahiye tha.",
    ],
    next: "Aage",
  },
  {
    id: "promises",
    eyebrow: "Diary aur calendar",
    title: "Chhote vaade",
    steps: [
      `<p class="lead">Bade vaade nahi — wo, jo main sach mein nibha sakta hoon.</p>
       <ol class="promises">
         <li><strong>Gussa aaye toh snap nahi.</strong> “Mujhe 10 minute chahiye” bolke ruk jaunga, phir shaanti se baat karunga.</li>
         <li><strong>Tumhari baatein yaad rakhunga.</strong> Jo tum batati ho — dates, plans, choices — main usi din phone mein note karunga.</li>
         <li><strong>Roz ek cheez bolunga</strong> jo mujhe tumhare baare mein pasand hai.</li>
       </ol>`,
    ],
    next: "Aage",
  },
  {
    id: "final",
    eyebrow: "Aakhri baat",
    title: "Baat karein?",
    final: true,
    steps: [
      "Main jaanta hoon, ek website se kuch theek nahi hota. Bas itna chahta hoon ki tum ye padho — aur jab tumhara mann ho, hum baat karein. Main yahin hoon.",
    ],
    next: "",
  },
];

export const TEXT = {
  enter: "Andar aao",
  loading: "tayyar ho raha hai…",
  hintDrag: "ungli se ghumao ✦",
  talk: "Baat karein?",
  talkSoft: "Main yahin hoon 🤍 Jab mann ho, bas ek message kar dena.",
  replay: "Phir se dekho",
  back: "Peeche",
  soundOn: "Sound on karke dekhna 🎧",
};
