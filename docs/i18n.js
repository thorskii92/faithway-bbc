/* Filipino (Tagalog) for the key parts of the home page: menu, welcome, service times, visit section and footer.
   Text is matched exactly against the English on the page; anything not listed stays in English
   (event, ministry and verse content from the editor stays as written).
   PLEASE REVIEW: these translations should be checked by a native speaker at church before going public. */
(function () {
  const FIL = {
    // menu
    'Updates': 'Balita', 'About': 'Tungkol sa Amin', 'Beliefs': 'Paniniwala', 'Pastor': 'Pastor', 'Ministries': 'Mga Ministeryo',
    'Music': 'Musika', 'Missions': 'Misyon', 'Visit': 'Bumisita', 'Menu': 'Menu',
    // welcome
    'Palawan · Established 2013': 'Palawan · Itinatag noong 2013',
    'See latest updates': 'Tingnan ang mga balita', 'Our missionaries': 'Ang aming mga misyonero',
    // services
    'Sunday': 'Linggo', 'Wednesday': 'Miyerkules', 'Saturday': 'Sabado',
    'Worship Service': 'Pagsamba', 'Afternoon Service': 'Panghapong Pagsamba',
    'Midweek Prayer Meeting': 'Pulong-Panalangin sa Gitna ng Linggo', 'Prayer Meeting': 'Pulong-Panalangin',
    'Directions': 'Paano pumunta',
    // announcements, reading
    'This week at Faithway': 'Ngayong linggo sa Faithway',
    'Read (KJV)': 'Basahin (KJV)', 'The whole plan': 'Ang buong plano',
    // updates, invitations
    'Latest updates': 'Mga balita', "What's happening at Faithway": 'Ano ang nangyayari sa Faithway',
    'Cantatas, anniversaries, camps, family days, saturation and extension class activities. Open any card for photos and details.':
      'Mga cantata, anibersaryo, camp, family day, saturation at extension class. Buksan ang alinmang card para sa mga larawan at detalye.',
    'See the church calendar →': 'Tingnan ang kalendaryo ng simbahan →',
    "You're invited": 'Inaanyayahan ka', 'Come and celebrate with us': 'Makipagdiwang ka sa amin',
    'Upcoming events with an invitation appear here. Share them with family and friends.':
      'Narito ang mga paparating na okasyon. Ibahagi ito sa iyong pamilya at mga kaibigan.',
    // ministries
    'There is a place for you': 'May lugar para sa iyo',
    'Every member and visitor is welcome to take part.': 'Malugod na inaanyayahang makibahagi ang bawat miyembro at bisita.',
    // visit
    'Visit us': 'Bumisita sa amin', 'You are welcome here': 'Malugod ka naming tinatanggap',
    'Where': 'Saan', 'When': 'Kailan', 'Connect': 'Makipag-ugnayan', 'Every Sunday': 'Tuwing Linggo',
    'Puerto Princesa City, Palawan, Philippines': 'Lungsod ng Puerto Princesa, Palawan, Pilipinas',
    'Open in Google Maps →': 'Buksan sa Google Maps →',
    'Sunday School 8:30 AM, Worship Service 10:00 AM and Afternoon Service 4:00 PM. Midweek prayer meeting Wednesday 6:00 PM, prayer meeting Saturday 7:00 AM.':
      'Sunday School 8:30 AM, Pagsamba 10:00 AM at Panghapong Pagsamba 4:00 PM. Pulong-panalangin tuwing Miyerkules 6:00 PM at Sabado 7:00 AM.',
    'Phone & email': 'Telepono at email',
    'Church phone number and email to be supplied.': 'Ilalagay pa ang telepono at email ng simbahan.',
    'Send a prayer request': 'Magpadala ng kahilingang panalangin',
    // footer
    'Explore': 'Mga Pahina', 'Services': 'Mga Pagtitipon',
    'About us': 'Tungkol sa amin', 'What we believe': 'Ang aming paniniwala', 'Music Ministry': 'Music Ministry',
    'Missions board': 'Mga misyonero', 'Church calendar': 'Kalendaryo ng simbahan', 'Bible reading plan': 'Plano sa pagbasa ng Biblia',
    'Kings and Prophets': 'Mga Hari at Propeta',
    'Midweek Prayer': 'Pulong-Panalangin (Miyerkules)',
    '· Sun 8:30 AM': '· Linggo 8:30 AM', '· Sun 10:00 AM': '· Linggo 10:00 AM', '· Sun 4:00 PM': '· Linggo 4:00 PM',
    '· Wed 6:00 PM': '· Miyerkules 6:00 PM', '· Sat 7:00 AM': '· Sabado 7:00 AM',
    'Phone and email coming soon.': 'Ilalagay pa ang telepono at email.',
    'Photos are shared with permission. To have a photo removed,': 'Ibinabahagi ang mga larawan nang may pahintulot. Kung nais mong ipatanggal ang isang larawan,',
    'contact the church': 'makipag-ugnayan sa simbahan',
    'Purok Matapat, San Jose, Puerto Princesa City, Palawan · Est. 2013': 'Purok Matapat, San Jose, Lungsod ng Puerto Princesa, Palawan · Itinatag noong 2013',
  };
  // phrases built by the page's scripts (next service, Bible reading)
  const DYN = {
    en: {
      next: 'Next', now: 'Now', today: (t) => `today at ${t}`, tomorrow: (t) => `tomorrow at ${t}`,
      later: (d, t, k) => `${d} at ${t} (in ${k} days)`, live: 'happening now',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      reading: (d, n) => `Today’s Bible reading · day ${d} of ${n}`, catchUp: 'Catch-up day · Bible reading',
    },
    fil: {
      next: 'Susunod', now: 'Ngayon', today: (t) => `ngayong araw, ${t}`, tomorrow: (t) => `bukas, ${t}`,
      later: (d, t, k) => `${d}, ${t} (${k} araw mula ngayon)`, live: 'nagaganap ngayon',
      days: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado'],
      reading: (d, n) => `Pagbasa ng Biblia ngayong araw · ika-${d} ng ${n} araw`, catchUp: 'Araw ng paghabol · Pagbasa ng Biblia',
    },
  };
  const SCOPES = '.nav, .menu-btn, .hero, .services, #notices .eyebrow, #reading, #updates .section__head, #invited .section__head, #ministries .section__head, #visit, .footer';
  const original = new WeakMap();
  let lang = 'en';
  try { if (localStorage.getItem('faithway-lang') === 'fil') lang = 'fil'; } catch { /* storage blocked */ }

  function apply(next, silent) {
    lang = next;
    try { localStorage.setItem('faithway-lang', lang); } catch { /* ignore */ }
    document.documentElement.lang = lang === 'fil' ? 'fil' : 'en';
    document.querySelectorAll(SCOPES).forEach((root) => {
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!original.has(n)) original.set(n, n.nodeValue);
        const en = original.get(n), key = en.trim();
        if (!key) continue;
        n.nodeValue = lang === 'fil' && FIL[key] ? en.replace(key, FIL[key]) : en;
      }
    });
    document.querySelectorAll('[data-lang-toggle]').forEach((b) => { b.textContent = lang === 'fil' ? 'English' : 'Filipino'; b.lang = lang === 'fil' ? 'en' : 'fil'; });
    if (!silent) document.dispatchEvent(new CustomEvent('faithway:lang', { detail: lang }));
  }
  window.FAITHWAY_I18N = {
    get lang() { return lang; },
    t: () => DYN[lang],
    apply,
    toggle: () => apply(lang === 'fil' ? 'en' : 'fil'),
    refresh: () => apply(lang, true),   // after the page adds text (e.g. contact details) re-run the translation
  };
})();
