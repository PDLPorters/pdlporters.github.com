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

var DocsLink = function(doc, title) {
  if (!title) title = doc.substr(5);
  this.title = title;
  this.doc = doc;
  this.href  = 'https://metacpan.org/pod/' + doc;
};

var wiki_url = "https://github.com/PDLPorters/pdl/wiki/";
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

function setBannerImages () {
  $('#banner-images').replaceWith(
    '<img src="images/banners/pos-1-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image1" height="79px" width="278px"/>'
    + '<img src="images/banners/pos-2-opt-' + getRandomInt(0,2) + '.jpg" alt="Banner image2" height="79px" width="93px"/>'
    + '<img src="images/banners/pos-4-opt-' + getRandomInt(0,1) + '.jpg" alt="Banner image3" height="79px" width="110px" style="margin-left: 25px"/>'
  );
}

// Store global data in this object
var MetaCPAN = {};

// provide localStorage shim to work around https://bugzilla.mozilla.org/show_bug.cgi?id=748620
try {
    MetaCPAN.storage = window.localStorage;
} catch (e) {}
if (!MetaCPAN.storage) {
    MetaCPAN.storage = {
        getItem: function(k) {
            return this["_" + k];
        },
        setItem: function(k, v) {
            return this["_" + k] = v;
        },
    };
}

$.extend({
    getUrlVars: function() {
        var vars = {},
            hash;
        var indexOfQ = window.location.href.indexOf('?');
        if (indexOfQ == -1) return vars;
        var hashes = window.location.href.slice(indexOfQ + 1).split('&');
        $.each(hashes, function(idx, hash) {
            var kv = hash.split('=');
            vars[kv[0]] = decodeURIComponent(kv[1]);
        });
        return vars;
    },
    getUrlVar: function(name) {
        return $.getUrlVars()[name];
    }
});

$(document).ready(function() {

    // Search box: Feeling Lucky? Shift+Enter
    $('#search-input').keydown(function(event) {
        if (event.keyCode == '13' && event.shiftKey) {
            event.preventDefault();

            /* To make this a lucky search we have to create a new
             * <input> element to pass along lucky=1.
             */
            var luckyField = document.createElement("input");
            luckyField.type = 'hidden';
            luckyField.name = 'lucky';
            luckyField.value = '1';

            var form = event.target.form;
            form.appendChild(luckyField);
            form.submit();
        }
    });

    // Autocomplete issues:
    // #345/#396 Up/down keys should put selected value in text box for further editing.
    // #441 Allow more specific queries to send ("Ty", "Type::").
    // #744/#993 Don't select things if the mouse pointer happens to be over the dropdown when it appears.
    // Please don't steal ctrl-pg up/down.
    var search_input = $("#search-input");
    var input_group = search_input.parent('.input-group');
    var ac_width = (input_group.length ? input_group : search_input).outerWidth();
    search_input.devbridgeAutocomplete({
        serviceUrl: 'https://fastapi.metacpan.org/search/autocomplete',
        // Wait for more typing rather than firing at every keystroke.
        deferRequestBy: 150,
        // If the autocomplete fires with a single colon ("type:") it will get no results
        // and anything else typed after that will never trigger another query.
        // Set 'preventBadQueries:false' to keep trying.
        preventBadQueries: false,
        dataType: 'json',
        lookupLitmit: 20,
        paramName: 'q',
        autoSelectFirst: false,
        // This simply caches the results of a previous search by url (so no reason not to).
        noCache: false,
        triggerSelectOnValidInput: false,
        maxHeight: 180,
        width: ac_width,
        onSelect: function(suggestion) {
          document.location.href = 'https://metacpan.org/pod/' + suggestion.value;
        },
        transformResult: function(data, currentValue) {
          var out = [];
          if ('hits' in data) {
            $.each(data.hits.hits, function(index, item) {
              out.push({value: item.sort[1], data: item.fields});
            });
          }
          return {suggestions: out};
        },
    });
    var ac = search_input.devbridgeAutocomplete();
    var formatResult = ac.options.formatResult;
    ac.options.formatResult = function(suggestion, currentValue) {
        var out = formatResult(suggestion, currentValue);
        if (suggestion.data.type == 'author') {
            return "<span class=\"suggest-author-label\">Author:</span> " + out;
        }
        return out;
    };

    // Disable the built-in hover events to work around the issue that
    // if the mouse pointer is over the box before it appears the event may fire erroneously.
    // Besides, does anybody really expect an item to be selected just by
    // hovering over it?  Seems unintuitive to me.  I expect anyone would either
    // click or hit a key to actually pick an item, and who's going to hover to
    // the item they want and then instead of just clicking hit tab/enter?
    $('.autocomplete-suggestions').off('mouseover.autocomplete');
    $('.autocomplete-suggestions').off('mouseout.autocomplete');

    $('#search-input.autofocus').focus();
    ['right'].forEach(function(side) {
        var panel = $('#' + side + "-panel");
        if (panel.length) {
            var panel_visible = MetaCPAN.storage.getItem("hide_" + side + "_panel") != 1;
            togglePanel(side, panel_visible);
        }
    });

    $('a[href*="/search?"]').on('click', function() {
        var url = $(this).attr('href');
        var result = /size=(\d+)/.exec(url);
        if (result && result[1]) {
            MetaCPAN.storage.setItem('search_size', result[1]);
        }
    });
    var size = MetaCPAN.storage.getItem('search_size');
    if (size) {
        $('#search-size').val(size);
    }
});

function set_page_size(selector, storage_name) {
    $(selector).each(function() {
        var url = this.href;
        var result = /[&;?]size=(\d+)(?:$|[&;])/.exec(url);
        var size;
        if (result && result[1]) {
            size = result[1];
            $(this).click(function() {
                MetaCPAN.storage.setItem(storage_name, size);
                return true;
            });
        } else if (size = MetaCPAN.storage.getItem(storage_name)) {
            if (/\?/.exec(url)) {
                this.href += '&size=' + size;
            } else {
                this.href += '?size=' + size;
            }
        }
        return true;
    });
}


function searchForNearest() {
    $("#busy").css({
        visibility: 'visible'
    });
    navigator.geolocation.getCurrentPosition(function(pos) {
            var query = $.getUrlVar('q');
            if (!query) {
                query = '';
            }
            query = query.replace(/(^|\s+)loc:\S+|$/, '');
            query = query + ' loc:' + pos.coords.latitude + ',' + pos.coords.longitude;
            query = query.replace(/(^|\s)\s+/g, '$1');
            document.location.href = '/mirrors?q=' + encodeURIComponent(query);
        },
        function() {
            $("#busy").css({
                visibility: 'hidden'
            });
        }, {
            maximumAge: 600000
        });
}
