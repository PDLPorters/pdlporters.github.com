<?
function formatContents($filename, $title='') {
	$content = file_get_contents($filename);
	$content = str_replace('<div name="index">',
						'<div class="index" name="index">',	$content);
	$content = str_replace("\n",'[\n]', $content);
	
	
	//
	//  Fix URLs.
	//
	$content = str_replace('<a href="./', '<a href="', $content);
	
	// PDL man pages.
	$content = preg_replace('/<a href="([\/\w]+)\.html(\#?\w*)">([^<]+)<\/a>/',
							'<a href="?docs=$1&title=$3$2">$3</a>', $content);
	
	// External modules -- link to perldoc.perl.org and hope they have it.
	$content = preg_replace('/<a href="..\/([\/\w]+)\.html(\#?\w*)">/',
							'<a href="http://perldoc.perl.org/$1.html$2">', $content);
	
	
	// Remove body tags.
	$content = preg_replace('/^.*<body[^>]*>/', '', $content);
	$content = preg_replace('/<\/body>.*$/', '', $content);
	
	// Replace <a name="foo"> with ids in all headers.
	for ($i = 1; $i <= 6; $i++)
		$content = preg_replace('|<h'.$i.'><a name="([^"]+)">([^<]+)</a></h'.$i.'>|',
		                         '<h'.$i.' id="$1">$2</h'.$i.'>', $content);
	
	// Put "top" links on all headings.
	$top_link = '<span style="font-size: 50%">[<a href="#top">top</a>]</span>';
	$content = str_replace('</h1>', " $top_link</h1>", $content);
	
	
	// Finished.
	$content = str_replace('[\n]', "\n", $content);
	$content = preg_replace('/\n+/', "\n", $content);
	return  "
	<b>See also:</b> <a href='?page=function-ref'>How do I search for a function?</a>
	<h1 id='top' class='title'>$title</h1>
	$content
	";
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head profile="http://www.w3.org/2005/10/profile">
	<title>Perl Data Language</title>
    <link rel="shortcut icon" href="images/favicon.ico"
    	  type="image/vnd.microsoft.icon"  />
    <link rel="stylesheet" type="text/css"
          href="http://www.google.com/cse/style/look/espresso.css" />
    <link rel='stylesheet' type='text/css' href='google-search.css' />
    <link rel="stylesheet"type="text/css" 
          href="css/jquery-ui-1.8.2.custom.css" />	
    <link rel='stylesheet' type='text/css' href='pdl.css' />
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.1/jquery.min.js"
		type="text/javascript"></script>
<script type="text/javascript" src="js/jquery.cycle.all.min.js"></script>
<script type="text/javascript" src="js/jquery-ui-1.8.2.custom.min.js"></script>
<script type="text/javascript">
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-17388934-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
  })();
</script>
</head>
<body>
 
  <!-- BANNER --> 
  <div class="banner">
    <a href="index.php?page=home">
      <img src="images/icons/pdl.png" height="79px" width="146px"/>
    </a>
	<img src="images/banners/pos-1-opt-<?=rand(0,2)?>.jpg" height="79px" width="278px"/>
	<img src="images/banners/pos-2-opt-<?=rand(0,2)?>.jpg" height="79px" width="93px"/>
	<img src="images/banners/pos-4-opt-<?=rand(0,1)?>.jpg" height="79px" width="110px" style="margin-left: 25px"/>
    <div id="cse-search-form" style="position: absolute; top: 20px; left: 700px">Loading</div>
  </div> 
  <!-- END BANNER -->

  <!-- SIDE BAR -->
  <div class="sidebar-container">
    <? include "content/sidebar.html" ?>
  </div>
  <!-- END SIDE BAR -->
  
  <!-- END GOOGLE SEARCH -->
  <table id="cse-container">
    <tr>
     <td id="cse"></td>
    </tr>
  </table>
  <script src="http://www.google.com/jsapi" type="text/javascript"></script>
  <script type="text/javascript">
  google.load('search', '1', {language : 'en'});
  google.setOnLoadCallback(function() {
    var customSearchControl = new google.search.CustomSearchControl('005624475199589227813:0cr_qvao0qc');
    customSearchControl.setResultSetSize(google.search.Search.FILTERED_CSE_RESULTSET);
    var options = new google.search.DrawOptions();
    options.setSearchFormRoot('cse-search-form');
    options.setAutoComplete(true);
    customSearchControl.draw('cse', options);
  }, true);
  </script>
  <!-- END GOOGLE SEARCH -->

  <!-- MAIN CONTENT -->
  <div class="main">
  <?
 	function issane($string) {
 		return preg_match('/^[-_a-zA-Z0-9\/]+$/',$string);
 	}
 	
 	if (isset($_GET['page']) && issane($_GET['page'])) {
	 	require_once "content/".$_GET['page'].".html";
	 	
	} elseif (isset($_GET['docs']) && issane($_GET['docs'])) {
		echo formatContents("PDLdocs/".$_GET['docs'].".html",$_GET['title']);
		
 	} else {
	 	require_once "content/home.html";
 	}
  ?>
  </div>
  <!-- END CONTENT -->
 
</body>
</html>

