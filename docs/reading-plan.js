/* Through the Bible in a year (King James Bible): all 1,189 chapters in canonical order, about 3–4 a day.
   Day 1 is January 1, Philippine time. In a leap year, February 29 is a catch-up day.
   Used by the home page ("Today's Bible reading") and reading-plan.html. */
(function () {
  const BOOKS = [
    ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34], ['Joshua', 24], ['Judges', 21], ['Ruth', 4],
    ['1 Samuel', 31], ['2 Samuel', 24], ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36], ['Ezra', 10], ['Nehemiah', 13],
    ['Esther', 10], ['Job', 42], ['Psalms', 150], ['Proverbs', 31], ['Ecclesiastes', 12], ['Song of Solomon', 8], ['Isaiah', 66], ['Jeremiah', 52],
    ['Lamentations', 5], ['Ezekiel', 48], ['Daniel', 12], ['Hosea', 14], ['Joel', 3], ['Amos', 9], ['Obadiah', 1], ['Jonah', 4], ['Micah', 7],
    ['Nahum', 3], ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2], ['Zechariah', 14], ['Malachi', 4],
    ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28], ['Romans', 16], ['1 Corinthians', 16], ['2 Corinthians', 13],
    ['Galatians', 6], ['Ephesians', 6], ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5], ['2 Thessalonians', 3], ['1 Timothy', 6],
    ['2 Timothy', 4], ['Titus', 3], ['Philemon', 1], ['Hebrews', 13], ['James', 5], ['1 Peter', 5], ['2 Peter', 3], ['1 John', 5], ['2 John', 1],
    ['3 John', 1], ['Jude', 1], ['Revelation', 22],
  ];
  const CH = [];
  BOOKS.forEach(([b, n], bi) => { for (let c = 1; c <= n; c++) CH.push({ b, c, bi }); });
  const DAYS = 365;

  // chapters for plan day 1..365, grouped by book: "Ruth 4; 1 Samuel 1–2"
  function reading(day) {
    const a = Math.floor(((day - 1) * CH.length) / DAYS), z = Math.floor((day * CH.length) / DAYS) - 1;
    const parts = [];
    for (let i = a; i <= z; i++) {
      const last = parts[parts.length - 1];
      if (last && last.b === CH[i].b) last.to = CH[i].c; else parts.push({ b: CH[i].b, from: CH[i].c, to: CH[i].c, ot: CH[i].bi < 39 });
    }
    const one = (p) => (BOOKS.find(([b]) => b === p.b)[1] === 1 ? p.b : `${p.b} ${p.from}${p.to !== p.from ? '–' + p.to : ''}`);
    const label = parts.map(one).join('; ');
    return {
      day, label, chapters: z - a + 1, testament: parts[0].ot ? 'Old Testament' : 'New Testament',
      url: 'https://www.biblegateway.com/passage/?version=KJV&search=' + encodeURIComponent(label.replace(/–/g, '-')),
    };
  }
  // today's plan day, by the calendar in the Philippines
  function todayInfo(now = new Date()) {
    const m = new Date(now.getTime() + 8 * 3600e3);   // Manila (UTC+8, no daylight saving)
    const y = m.getUTCFullYear(), mo = m.getUTCMonth(), d = m.getUTCDate();
    const doy = Math.round((Date.UTC(y, mo, d) - Date.UTC(y, 0, 1)) / 864e5) + 1;
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (leap && mo === 1 && d === 29) return { year: y, day: 59, catchUp: true };
    return { year: y, day: leap && doy > 60 ? doy - 1 : doy, catchUp: false };
  }
  // plan day → date in the given year (for the full list)
  function dateOf(day, year) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return new Date(Date.UTC(year, 0, day + (leap && day > 59 ? 1 : 0), 12));
  }
  window.READING_PLAN = { reading, todayInfo, dateOf, DAYS };
})();
