// needs jQuery and purl.js

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var param_page = $.url().param('page');
var param_docs = $.url().param('docs');
var param_title = $.url().param('title');

function transformLinks () {
  var wiki_url = "http://sourceforge.net/p/pdl/wiki/";

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
    if (! param_title) {
      param_title = module;
    }
    var pod = $(
      "<b>See also:</b> <a href='?page=function-ref'>How do I search for a function?</a>"
      + "<h1 class='title'>" + param_title + "</h1><div class='pod'>" + data + "</div>"
    );
    pod.find('a[href*="metacpan.org"]').each(function(index){
      var url = $(this).url(true);
      if ( ! url.segment(-2) === 'module' ) {
        return
      } 
      var name = url.segment(-1);
      $(this).attr( 'href', '?docs=' + name + '&amp;title=' + name );
    });
    $('#main').html(pod);
    $('div.pod').after('<h2>Thanks</h2><p>This documentation was obtained via <a href="http://metacpan.org">MetaCPAN</a></p>');
  });
}

function setBannerImages () { 
  $('#banner-images').replaceWith(
    '<img src="images/banners/pos-1-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image1" height="79px" width="278px"/>'
    + '<img src="images/banners/pos-2-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image2" height="79px" width="93px"/>'
    + '<img src="images/banners/pos-4-opt-' + getRandomInt(0,1) + '.jpg" alt="Banner image3" height="79px" width="110px" style="margin-left: 25px"/>'
  );
}

$(function () {
  setBannerImages();
  $('#sidebar').load("content/sidebar.html", function () { transformLinks() } );
  loadMain();
});
