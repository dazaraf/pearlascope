// Team profiles. Every claim sourced; "unverified" marks single-secondary-source items.
window.TEAM = [
  {
    name: 'Omri Weinstein',
    role: 'Co-founder & CEO, Pearl Research Labs',
    photo: 'https://omriweinstein.huji.ac.il/sites/default/files/styles/os_files_xxlarge/public/omri.weinstein/files/tmvnh1.png',
    bio: 'Associate Professor of Computer Science at the Hebrew University, on leave from Columbia. Princeton PhD in complexity theory, Simons Junior Fellow at NYU Courant, NSF CAREER award, Samson Prime-Minister Award. In industry: Chief Scientist at VAST Data, senior research scientist at Deci.AI (acquired by NVIDIA).',
    links: [
      { label: '@WeinsteinOmri', url: 'https://x.com/WeinsteinOmri' },
      { label: 'HUJI page', url: 'https://omriweinstein.huji.ac.il/' },
      { label: 'Profile', url: 'https://cfc-stmoritz.com/profiles/omri-weinstein' },
      { label: 'Founding paper', url: 'https://arxiv.org/abs/2504.09971' },
    ],
  },
  {
    name: 'Ilan Komargodski',
    role: 'Co-founder · cryptographer',
    bio: 'Associate Professor at the Hebrew University School of CS and Engineering, and with NTT Research\'s CIS Lab since 2019. Weizmann PhD under Moni Naor, Cornell Tech postdoc. CCS 2023 Distinguished Paper (FutORAMa). Co-author with Dan Boneh of Hawkeye, which the current whitepaper builds on. Co-author of the founding paper; Pearl itself doesn\'t publish titles.',
    links: [
      { label: '@komargodski', url: 'https://x.com/komargodski' },
      { label: 'HUJI page', url: 'https://www.cs.huji.ac.il/~ilank/' },
      { label: 'NTT Research', url: 'https://ntt-research.com/2021/06/01' },
    ],
  },
  {
    name: 'Engineering', icon: 'code',
    role: 'Core committers on GitHub',
    bio: 'Lead committer Or Aharonee (about half of the last 100 commits), with Jonathan M. Weiss (HUJI PhD student), Roie Finkelshtein, Sacha Elkoubi, Liad Madmon and others. The whitepaper is signed "Pearl Research Team". The GitHub org was created 2 Feb 2026.',
    links: [{ label: 'GitHub', url: 'https://github.com/pearl-research-labs/pearl' }],
  },
  {
    name: 'The company', icon: 'logo',
    role: 'Pearl Research Ltd. · @prlnet',
    bio: 'Token side: no pre-mine, no investor or founder allocation in code. About 121.7M PEARL (over a third of everything mined so far) came out in the first ~6 days at low difficulty; an earlier whitepaper said that funded team R&D, and team holdings are undisclosed. Company side <span class="unv">unverified</span>: RootData, citing TheMarker (25 Oct), reports a $130M raise ($55M equity + $75M GPU fund) from Lightspeed, Ribbit and Square Peg. Both can be true: a VC-free token and a VC-backed lab.',
    links: [
      { label: '@prlnet', url: 'https://x.com/prlnet' },
      { label: 'pearlresearch.ai', url: 'https://pearlresearch.ai' },
      { label: 'RootData report', url: 'https://www.rootdata.com/news/802050' },
      { label: 'Early-mining data', url: 'https://www.odaily.news/en/post/5213428' },
    ],
  },
];
if (window.DATA_READY) window.DATA_READY();
