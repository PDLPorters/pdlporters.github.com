// needs jQuery and purl.js

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function fracToPercent (frac) {
  return Math.floor( 100 * frac ) + "%";
}

var param_page = $.url().param('page');
var param_docs = $.url().param('docs');
var param_title = $.url().param('title');
var param_search = $.url().param('search');

function q(query) { return $.url().param(query) }

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

var wiki_url = "http://sourceforge.net/p/pdl/wiki/";
var WikiLink = function(title, query) {
  this.title = title;
  this.href  = wiki_url + (query ? query : '');
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
  var html = '<h2>Search provided by <a href="http://metacpan.org">MetaCPAN</a></h2>'
             + '<p>Found ' + data.hits.total + ' hits</p><hr>';
  $.each( hits, function (index, item) {
    var fields = item.fields;
    if ( ! fields ) {
      return;
    }
    var name = fields.documentation || fields.module[0].name;
    html += '<p>(' + fracToPercent( item._score / max_score ) + ') '
         + docLink( name ) + ' - ' + item.fields.abstract + '</p>';
  });
  $('#main').html( html );
}

function doSearch (query) {
  /*$('#main').html(
    '<p>Searching for ' + query
    + ' on <a href="http://metacpan.org">MetaCPAN</a></p>'
  );*/
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

function loadMain () {
  if (param_search) {
    doSearch(param_search);
  } else if (param_page) {
    $('#main').load("content/" + param_page + ".html");
  } else if (param_docs) {
    loadPod(param_docs);
  } else {
    $('#main').load("content/home.html");
  }
}

function loadPod (module) {
  /*$('#main').html(
    '<p>Loading documentation for ' + module
    + ' from <a href="http://metacpan.org">MetaCPAN</a></p>'
  );*/
  $.get('http://api.metacpan.org/pod/' + module + '?content-type=text/html', function (data) {
    if (! param_title) {
      param_title = module;
    }

    // by using parseHTML we remove script tags
    var pod = $($.parseHTML(
      '<b>See also:</b> <a href="?page=function-ref">How do I search for a function?</a>'
      + '<h1 class="title">' + param_title + '</h1><div class="pod">' + data + '</div>'
    ));

    // change pod links
    pod.find('a[href*="metacpan.org"]').each(function(index){
      var url = $(this).url(true);

      if ( ! url.segment(-2) === 'module' ) {
        return
      }
      var name = url.segment(-1);
      $(this).attr( 'href', '?docs=' + name + '&title=' + name );
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

$(function () {
  setBannerImages();
  // load sidebar content, it populates a sidebar variable
  $.getScript(
    'content/sidebar.js',
    function(){ rivets.bind($('#sidebar'), {sections: sidebar}) }
  );
  loadMain();
});
