<?
//
//  Choose a random banner.
//
function pickBanner() {
	// Banners are identified by a binary number from 0000 to 1111.
	$binary = '';
	$binary .= rand(0,1);
	$binary .= rand(0,1) * rand(0,1); // I like 0 better. :-)
	$binary .= rand(0,1);
	$binary .= rand(0,1);
	
	return "blue-$binary.jpg";
}
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
	
	
	
	$content = preg_replace('/^.*<body[^>]*>/', '', $content);
	$content = preg_replace('/<\/body>.*$/', '', $content);
	$content = str_replace('[\n]', "\n", $content);
	$content = preg_replace('/\n+/', "\n", $content);
	return "<h1 class='title'>$title</h1>$content";
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
    <link rel='stylesheet' type='text/css' href='pdl.css' />

<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.1/jquery.min.js"
		type="text/javascript"></script>
<script type="text/javascript" src="js/jquery.cycle.all.min.js"></script>
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
    <img src="images/banners/pos-0-logo.jpg" height="79px" width="146px"/>
	<div id="pos1" class="rotation">
	<img src="images/banners/pos-1-opt-0.jpg" height="79px" width="278px"/>
	<img src="images/banners/pos-1-opt-1.jpg" height="79px" width="278px"/>
	<img src="images/banners/pos-1-opt-2.jpg" height="79px" width="278px"/>
	</div> 
	<div id="pos2" class="rotation" style="left: 435px">
	<img src="images/banners/pos-2-opt-0.jpg" height="79px" width="93px"/>
	<img src="images/banners/pos-2-opt-1.jpg" height="79px" width="93px"/>
	<img src="images/banners/pos-2-opt-2.jpg" height="79px" width="93px"/>
	</div> 
	<div id="pos3" class="rotation" style="left: 555px">
	<img src="images/banners/pos-3-opt-0.jpg" height="79px" width="107px"/>
	<img src="images/banners/pos-3-opt-1.jpg" height="79px" width="107px"/>
	</div> 
	<div id="pos4" class="rotation" style="left: 685px">
	<img src="images/banners/pos-4-opt-0.jpg" height="79px" width="110px"/>
	<img src="images/banners/pos-4-opt-1.jpg" height="79px" width="110px"/>
	</div> 
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
     <td id="cse-search-form">Loading</td>
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
 
<script type="text/javascript"> 
$(document).ready(function() {
	// 
	// Banner animation.
	// 
	
	// Change a random part of the banner.
	function changeBanner() {
		var rand = Math.random();
		if (0.00 < rand && rand < 0.25) $('.banner #pos1').cycle('next');
		if (0.25 < rand && rand < 0.50) $('.banner #pos2').cycle('next');
		if (0.50 < rand && rand < 0.75) $('.banner #pos3').cycle('next');
		if (0.75 < rand && rand < 1.00) $('.banner #pos4').cycle('next');
	}
	
	// Change the banner every 5 seconds forever.
	function rotateBanner() {
		changeBanner();
		setTimeout(rotateBanner, 5000);
	}
	
	// Initialize slideshow plugin and start rotation.
	$('.rotation').cycle({ fx: 'fade', timeout: 0 });
	rotateBanner();
});
</script> 

</body>
</html>

