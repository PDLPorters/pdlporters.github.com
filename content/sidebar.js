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
      new PageLink('PDL Book', 'book/index'),
      new PageLink('PDL Reference Docs', 'reference'),
      new DocsLink('PDL::FAQ', 'Frequently Asked Questions'),
      new DocsLink('PDL::Tutorials'),
      new DocsLink('PDL::Modules'),
      new DocsLink('PDL::Course'),
      new DocsLink('PDL::Index'),
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
      new ExternalLink('Browse Git', 'https://github.com/PDLPorters/pdl'),
      new ExternalLink('Bugs', 'https://github.com/PDLPorters/pdl/issues'),
      new ExternalLink('Pull Requests', 'https://github.com/PDLPorters/pdl/pulls'),
      new PageLink('Credits', 'credits'),
      new ExternalLink('Website issues', 'https://github.com/PDLPorters/pdlporters.github.com/issues'),
    ],
  },
];
