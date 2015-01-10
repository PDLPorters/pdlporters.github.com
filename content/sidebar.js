sidebar = [
  {
    title: 'About PDL',
    pages: [
      new HomeLink(),
      new PageLink('Get PDL', 'install'),
      new PageLink('Screenshots', 'screenshots/index'),
      new PageLink('PDL Users', 'users'),
      new PageLink('Mailing Lists', 'mailing-lists'),
    ],
  },
  {
    title: 'Documentation',
    pages: [
      new PageLink('PDL Book', 'FirstSteps'),
      new DocsLink('FAQ', 'PDL::FAQ', 'Frequently Asked Questions'),
      new DocsLink('Tutorials', 'PDL::Tutorials'),
      new DocsLink('Modules', 'PDL::Modules'),
      new DocsLink('Course', 'PDL::Course'),
      new DocsLink('Index', 'PDL::Index'),
    ],
  },
  {
    title: 'Resources',
    pages: [
      new PageLink('Demos', 'demos/index'),
      new WikiLink('Presentations', 'Colloquia'),
      new WikiLink('PDL Wiki'),
      new WikiLink('External Libs', 'Libraries'),
    ],
  },
  {
    title: 'Development',
    pages: [
      new PageLink('Get Started', 'develop'),
      new ExternalLink('Browse Git', 'http://pdl.git.sourceforge.net'),
      new ExternalLink('Bugs', 'http://sourceforge.net/tracker/?func=browse&amp;group_id=612&amp;atid=100612&amp;status=1'),
      new ExternalLink('Patches', 'http://sourceforge.net/tracker/?func=browse&amp;group_id=612&amp;atid=300612&amp;status=1'),
      new PageLink('Credits', 'credits'),
    ],
  },
];


