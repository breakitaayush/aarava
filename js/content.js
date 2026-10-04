/*
 * ─────────────────────────────────────────────────────────────
 *  ALL INVITE CONTENT LIVES HERE.
 *  Edit the text below and refresh the page — no other file
 *  needs to change. Anything marked "Lorem ipsum" or "PLACEHOLDER"
 *  is waiting for your real content.
 * ─────────────────────────────────────────────────────────────
 */
window.WEDDING = {
  couple: {
    groom: "Aayush",
    groomFull: "Aayush Paliwal",
    bride: "Durva",
    brideFull: "Durva Paliwal",
    monogram: ["A", "D"],
  },

  hero: {
    invocation: "॥ श्री गणेशाय नमः ॥",
    line: "Together with their families, request the pleasure of your company",
    hindiTitle: "शुभ विवाह",
    dates: "19 & 20 February 2027",
    place: "Vrindavan Palace · Jaipur",
  },

  // The countdown on the first screen counts down to this moment (IST).
  countdownTo: "2027-02-20T17:30:00+05:30",

  venue: {
    name: "Vrindavan Palace",
    address:
      "200 Feet Mahal Road, Jagatpura, Beelwa, Sanganer, Mathurawala, Jaipur, Rajasthan 302022",
    mapsLink: "https://maps.app.goo.gl/8jw9VDGnduFdjCBq8",
    embedQuery: "Vrindavan Palace, Mahal Road, Jagatpura, Jaipur",
    note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Parking, stay and travel notes can go here.",
  },

  // Drop your track at this path. If the file is missing the music button simply hides.
  music: "assets/music/music.mp3",

  /*
   * Events. Times use Indian Standard Time (+05:30).
   * icon: one of "music", "haldi", "fire", "crown", "feast"
   * palette: dress-code colour swatches shown on the card
   */
  events: [
    {
      name: "Sangeet",
      hindi: "संगीत",
      icon: "music",
      start: "2027-02-19T19:00:00+05:30",
      end: "2027-02-19T23:30:00+05:30",
      theme: "Lorem Ipsum Night",
      dressCode: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      palette: ["#1f1147", "#c9a24a", "#b5174a", "#e8e0f0"],
    },
    {
      name: "Haldi",
      hindi: "हल्दी",
      icon: "haldi",
      start: "2027-02-20T10:00:00+05:30",
      end: "2027-02-20T13:00:00+05:30",
      theme: "Lorem Ipsum Morning",
      dressCode: "Lorem ipsum dolor sit amet, sed do eiusmod tempor.",
      palette: ["#f6c445", "#f39c12", "#fff3c4", "#7a9a3a"],
    },
    {
      name: "Phere",
      hindi: "फेरे",
      icon: "fire",
      start: "2027-02-20T17:30:00+05:30",
      end: "2027-02-20T19:00:00+05:30",
      theme: "Lorem Ipsum Vows",
      dressCode: "Lorem ipsum dolor sit amet, ut labore et dolore magna.",
      palette: ["#8b0f1f", "#c9a24a", "#f3d9a4", "#b5174a"],
    },
    {
      name: "Baraat & Swagat",
      hindi: "बारात एवं स्वागत",
      icon: "crown",
      start: "2027-02-20T19:15:00+05:30",
      end: "2027-02-20T20:00:00+05:30",
      theme: "Lorem Ipsum Procession",
      dressCode: "Lorem ipsum dolor sit amet, quis nostrud exercitation.",
      palette: ["#f2e1c1", "#c9a24a", "#7b1e1e", "#e7a6a1"],
    },
    {
      name: "Reception",
      hindi: "प्रीतिभोज",
      icon: "feast",
      start: "2027-02-20T20:00:00+05:30",
      end: "2027-02-20T23:30:00+05:30",
      theme: "Lorem Ipsum Soirée",
      dressCode: "Lorem ipsum dolor sit amet, duis aute irure dolor.",
      palette: ["#0e2a3a", "#c9a24a", "#efe6d6", "#5c0a14"],
    },
  ],

  /*
   * Love story chapters. Set photo to e.g. "assets/photos/1.jpg"
   * to replace the placeholder frame.
   */
  story: [
    {
      when: "20XX",
      title: "Lorem Ipsum",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      photo: "",
    },
    {
      when: "20XX",
      title: "Dolor Sit Amet",
      text: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      photo: "",
    },
    {
      when: "20XX",
      title: "Consectetur",
      text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      photo: "",
    },
    {
      when: "20XX",
      title: "Adipiscing Elit",
      text: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      photo: "",
    },
    {
      when: "2027",
      title: "Forever Begins",
      text: "Lorem ipsum dolor sit amet — and now, we can't wait to celebrate with you in Jaipur.",
      photo: "",
    },
  ],

  // Quiz — "answer" is the index (0-based) of the correct option.
  quiz: [
    {
      q: "Where did Aayush & Durva first meet?",
      options: ["Lorem ipsum", "Dolor sit amet", "Consectetur", "Adipiscing elit"],
      answer: 1,
      reveal: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      q: "Who said “I love you” first?",
      options: ["Aayush", "Durva", "Both, at the same time", "Still waiting"],
      answer: 0,
      reveal: "Lorem ipsum dolor sit amet, sed do eiusmod tempor.",
    },
    {
      q: "What was their first date?",
      options: ["Lorem ipsum", "Dolor sit", "Amet consectetur", "Elit sed do"],
      answer: 2,
      reveal: "Ut enim ad minim veniam, quis nostrud exercitation.",
    },
    {
      q: "Who is the better cook?",
      options: ["Aayush", "Durva", "Swiggy", "Mummy"],
      answer: 3,
      reveal: "Duis aute irure dolor in reprehenderit in voluptate.",
    },
    {
      q: "Where did the proposal happen?",
      options: ["Lorem ipsum", "Dolor sit amet", "Consectetur", "Adipiscing elit"],
      answer: 0,
      reveal: "Excepteur sint occaecat cupidatat non proident.",
    },
  ],

  // PLACEHOLDER contacts — replace names and numbers (digits only, with country code).
  contacts: [
    { name: "Lorem Paliwal", role: "Father of the Groom", phone: "919999999999" },
    { name: "Ipsum Paliwal", role: "Mother of the Groom", phone: "919999999998" },
    { name: "Dolor Ipsum", role: "Father of the Bride", phone: "919999999997" },
    { name: "Amet Ipsum", role: "Mother of the Bride", phone: "919999999996" },
  ],

  closing: {
    hindi: "सादर आमंत्रित",
    line: "Your presence and blessings will make our celebration complete.",
    from: "With love, the Paliwal Family",
  },
};
