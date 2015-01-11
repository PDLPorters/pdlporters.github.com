// requires jQuery, URI.js and rivets

function loadMain () {
  setBannerImages();

  // load sidebar content, it populates a sidebar variable
  $.getScript(
    'content/sidebar.js',
    function(){ rivets.bind($('#sidebar'), {sections: sidebar}) }
  );

  // the "router"
  var search = q('search');
  if (search) {
    return doSearch(search);
  }

  var docs = q('docs');
  if (docs) {
    return loadPod(docs);
  }

  var page = q('page') || 'home';
  $('#main').load("content/" + page + ".html");
}
$(loadMain);

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function q(query) { return (new URI()).query(true)[query] }

var HomeLink = function() {
  this.href  = '?page=home';
  this.title = 'Home';
  var page   = q('page');
  this.selected = page === 'home' || ( !page && !q('docs') && !q('search') );
};

var PageLink = function(title, page) {
  this.page  = page;
  this.href  = '?page=' + page;
  this.title = title;
  this.selected = q('page') === this.page;
};

var DocsLink = function(title, doc, extra) {
  this.title = title;
  this.doc = doc;
  this.href  = '?docs=' + doc;
  if (extra) {
    this.href += '&title=' + doc + ' - ' + extra;
  }
  this.selected = q('docs') === this.doc;
};

var wiki_url = "http://sourceforge.net/apps/mediawiki/pdl/index.php";
var WikiLink = function(title, query) {
  this.title = title;
  this.href  = wiki_url + (query ? '?title=' + query : '');
  this.selected = false;
};

var ExternalLink = function(title, link) {
  this.title = title;
  this.href  = link;
  this.selected = false;
}

function searchSuccess (data) {
  var max_score = data.hits.max_score;
  var hits = data.hits.hits;
  console.log( data );

  search.total = data.hits.total;
  search.results = [];
  $.each( hits, function (index, item) {
    var fields = item.fields;
    if ( ! fields ) { return }
    var name = fields.documentation || fields.module[0].name;
    var out  = {
      name:  name,
      score: Math.floor( 100 * (item._score / max_score) ),
      href: '?docs=' + name,
      abstract: item.fields.abstract,
    };
    search.results.push(out);
  });
}

function doSearch (query) {
  var mysearch = {
    "query" : { "filtered" : {
      "query" : {
        "query_string" : {
          "query" : query,
          "fields" : [ "pod.analyzed", "module.name" ]
        }
      },
      "filter" : { "and" : [
        { "term" : { "distribution" : "PDL" } },
        { "term" : { "status" : "latest" } }
      ]}
    }},
    "fields" : [ "documentation", "abstract", "module" ],
    "size" : 20
  };
  $.ajax({
    type : "GET",
    url : 'http://api.metacpan.org/v0/file/_search',
    data : 'source=' + JSON.stringify(mysearch),
    dataType: "jsonp",
    success : searchSuccess,
  }).error( function() { console.log("Error attempting to search metacpan") } );
}

function loadPod (module) {
  /*$('#main').html(
    '<p>Loading documentation for ' + module
    + ' from <a href="http://metacpan.org">MetaCPAN</a></p>'
  );*/
  var title = q('title');
  $.get('http://api.metacpan.org/pod/' + module + '?content-type=text/html', function (data) {
    if (! title) {
      title = module;
    }

    // by using parseHTML we remove script tags
    var pod = $($.parseHTML(
      '<b>See also:</b> <a href="?page=function-ref">How do I search for a function?</a>'
      + '<h1 class="title">' + title + '</h1><div class="pod">' + data + '</div>'
    ));

    // change pod links
    pod.find('a:uri(domain = metacpan.org):uri(directory *= /pod/)').each(function(index){
      var url = $(this).uri();
      var target = new URI();
      target.fragment(''); // clear any existing fragment

      var name = url.filename();
      target.query({docs:name, title:name});

      var frag = url.fragment();
      if ( frag ) {
        target.fragment(frag);
      }

      $(this).uri(target);
    });

    $('#main').html(pod);
    $('div.pod').after('<h2>Thanks</h2><p>This documentation was obtained via <a href="http://metacpan.org">MetaCPAN</a></p>');

    loadMathJax();
  });
}

function setBannerImages () {
  $('#banner-images').replaceWith(
    '<img src="images/banners/pos-1-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image1" height="79px" width="278px"/>'
    + '<img src="images/banners/pos-2-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image2" height="79px" width="93px"/>'
    + '<img src="images/banners/pos-4-opt-' + getRandomInt(0,1) + '.jpg" alt="Banner image3" height="79px" width="110px" style="margin-left: 25px"/>'
  );
}

function loadMathJax () {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src  = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
  document.getElementsByTagName("head")[0].appendChild(script);
}

