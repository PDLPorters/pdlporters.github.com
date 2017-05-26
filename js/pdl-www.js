// requires jQuery, URI.js and rivets

function loadMain () {
  setBannerImages();

  // load sidebar content, it populates a sidebar variable
  $.getScript(
    'content/sidebar.js',
    function(){ rivets.bind($('#sidebar'), {sections: sidebar}) }
  );

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

function setBannerImages () {
  $('#banner-images').replaceWith(
    '<img src="images/banners/pos-1-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image1" height="79px" width="278px"/>'
    + '<img src="images/banners/pos-2-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image2" height="79px" width="93px"/>'
    + '<img src="images/banners/pos-4-opt-' + getRandomInt(0,1) + '.jpg" alt="Banner image3" height="79px" width="110px" style="margin-left: 25px"/>'
  );
}


