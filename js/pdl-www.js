var param_page = $.url().param('page');
var param_docs = $.url().param('docs');

function transformLinks () {
  var wiki_url = "http://sourceforge.net/apps/mediawiki/pdl/index.php";

  console.log( "Page: " + param_page + " Docs: " + param_docs );

  $('li.homeLink').each(function (index) {
    var title = $(this).attr('title');

    if (param_page === 'home' || ( !param_page && !param_docs )) {
      $(this).addClass("selected");
    }
    $(this).html("<a href='?page=home'>" + title + "</a>");
  });

  $('li.wikiLink').each(function (index) {
    var title = $(this).attr('title');
    var query = $(this).attr('query');

    query = query ? "?" + query : "";

    var title = $(this).attr('title');
    $(this).html("<a href=" + wiki_url + query + ">" + title + "</a>");
  });

  $('li.pageLink').each(function (index) {
    var title = $(this).attr('title');
    var page = $(this).attr('page');

    if (page === param_page) {
      $(this).addClass("selected");
    }
    var title = $(this).attr('title');
    $(this).html("<a href='?page=" + page + "'>" + title + "</a>");
  });

  $('li.docsLink').each(function (index) {
    var pageTitle = $(this).attr('pageTitle');
    var linkTitle = $(this).attr('linkTitle');
    var docs = $(this).attr('docs');

    if (docs === param_docs) {
      $(this).addClass("selected");
    }
    var title = $(this).attr('title');
    $(this).html("<a href='?docs=" + docs + "&amp;title=" + pageTitle + "'>" + linkTitle + "</a>");
  });
}

function loadMain () {
  if (param_page) {
    $('#main').load("content/" + param_page + ".html");
  } else if (param_docs) {
    loadPod(param_docs);
  } else {
    $('#main').load("content/home.html");
  }
}

function loadPod (module) {
  $.get('http://api.metacpan.org/pod/' + module + '?content-type=text/html', function (data) {
    var pod = $(data);
    pod.find('a[href*="metacpan.org"]').each(function(index){
      var url = $(this).url(true);
      if ( ! url.segment(-2) === 'module' ) {
        return
      } 
      var name = url.segment(-1);
      $(this).attr( 'href', '?docs=' + name + '&amp;title=' + name );
    });
    $('#main').html(pod);
  });
}

$(function () {
  $('#sidebar').load("content/sidebar.html", function () { transformLinks() } );
  loadMain();
});
