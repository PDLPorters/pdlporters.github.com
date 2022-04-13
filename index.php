<?
function formatDocs($filename, $title='') {
	$content = file_get_contents($filename);
	$content = str_replace("\n",'[\n]', $content);

	$escaped_title = htmlspecialchars($title);
	
	// Fix links to man pages.
	$content = preg_replace('/<a href="([\/\w]+)\.html(\#?\w*)">([^<]+)<\/a>/',
							'<a href="?docs=$1&amp;title=$3$2">$3</a>', $content);
	
	$content = preg_replace('/<a href="(PP-Inline)\.html(\#?\w*)">([^<]+)<\/a>/',
				'<a href="?docs=$1&amp;title=$3$2">$3</a>',$content);

	// External modules -- link to metacpan.org: they WILL have it!
	// Note that this is not perfect.  There's some complication because we don't know how many / to replace with ::. My REGEX-fu is probably not up to snuff.
	// It assumes that starting the URL with ../ means that it is out of the PDL namespace, and therefore an external module.  But if the current doc is (say) PDL::IO::FITS and we want to link to PDL::Core, then there will be some leading ../ but still within the namespace.  There's only so much DAL can do with PHP--I think the problem is with pod2html, honestly.  Anyway, it's no worse than the previous solution (kept, but commented, below). Note that this way there is no way to specifically go to any anchored section on the page, because of the CPAN redirect, so we just drop it. Ultimately we should just link to metacpan, but they have no docs for modules that come from .pd files, so we're stuck for now.
	if (preg_match_all('/<a href="..\/([\/\w]+)\.html(\#?\w*)">/',$content,$matches,PREG_SET_ORDER)) {
	  //	  print "<pre>I matched " . count($matches) . " times!\n";
	  for ($i=0; $i<count($matches);$i++){
	    $string = $matches[$i][1];
	    $pkg_delim = preg_replace('|/|','::',$string);
	    //print "replacing $string with $pkg_delim\n";
	    $content = preg_replace("|<a href=\"..\/($string)\.html(\#?\w*)\">([^<]+)<\/a>|",
			 "<a href=\"https://metacpan.org/pod/$pkg_delim\">$3</a>",$content);
	  }
	} //else {
	  //print "I didn't match!\n";
	//}
	//print "</pre>";

	// This was the original version, which was also not perfect.
	// External modules -- link to perldoc.perl.org and hope they have it.
	//	$content = preg_replace('/<a href="..\/([\/\w]+)\.html(\#?\w*)">/',
		//		'<a href="http://perldoc.perl.org/$1.html$2">', $content);
	
	// Remove body tags.
	$content = preg_replace('/^.*<body[^>]*>/', '', $content);
	$content = preg_replace('/<\/body>.*$/', '', $content);
	
	// Finished.
	$content = str_replace('[\n]', "\n", $content);
	$content = preg_replace('/\n+/', "\n", $content);
	return  "
	<b>See also:</b> <a href='?page=function-ref'>How do I search for a function?</a>
	<h1 class='title'>$escaped_title</h1>
	<div class='pod'>$content</div>
	";
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head profile="http://www.w3.org/2005/10/profile">
<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
	<title>Perl Data Language</title>
    <link rel="shortcut icon" href="images/favicon.ico"
    	  type="image/vnd.microsoft.icon"  />
    <link rel="stylesheet" type="text/css"
          href="http://www.google.com/cse/style/look/espresso.css" />
    <link rel='stylesheet' type='text/css' href='google-search.css' />
    <link rel="stylesheet" type="text/css" 
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
      <img src="images/icons/pdl.png" alt="PDL" height="79px" width="146px"/>
    </a>
	<img src="images/banners/pos-1-opt-<?=rand(0,2)?>.jpg" alt="Banner image1" height="79px" width="278px"/>
	<img src="images/banners/pos-2-opt-<?=rand(0,2)?>.jpg" alt="Banner image2" height="79px" width="93px"/>
	<img src="images/banners/pos-4-opt-<?=rand(0,1)?>.jpg" alt="Banner image3" height="79px" width="110px" style="margin-left: 25px"/>

<form method="get" action="https://www.google.com/search" style="position: absolute; top: 10px; left: 700px">
<fieldset>
<legend>Search PDL site and docs</legend>
<input type="text" name="q" size="25"/>
<input type="hidden" name="sitesearch" value="pdl.perl.org"/>
<input type="submit" value="Search"/>
</fieldset>
</form>

</div>
  <!-- END BANNER -->

  <!-- SIDE BAR -->
  <div class="sidebar-container">
    <? include "content/sidebar.html" ?>
  </div>
  <!-- END SIDE BAR -->
  
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
		echo formatDocs("PDLdocs/".$_GET['docs'].".html",$_GET['title']);
		
 	} else {
	 	require_once "content/home.html";
 	}
  ?>
  </div>

  <!-- END CONTENT -->

</body>
</html>

