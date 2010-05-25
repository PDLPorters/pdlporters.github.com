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
	$content = str_replace('<a href="./', '<a href="', $content);
	$content = preg_replace('/<a href="([\/\w]+)\.html">([^<]+)<\/a>/',
							'<a href="?docs=$1&title=$2">$2</a>', $content);
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
    <link rel='stylesheet' type='text/css' href='pdl.css' />

<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.1/jquery.min.js"
		type="text/javascript"></script>
<script type="text/javascript" src="js/jquery.cycle.all.min.js"></script>
</head>
<body>

  <!-- BANNER -->
  <div class="banner"><img src="images/banners/<?= pickBanner() ?>"/></div>
  <!-- END BANNER -->

  <!-- SIDE BAR -->
  <div class="sidebar-container">
    <? include "content/sidebar.html" ?>
  </div>
  <!-- END SIDE BAR -->

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

