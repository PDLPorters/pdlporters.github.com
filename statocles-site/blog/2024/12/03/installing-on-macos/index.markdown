---
title: Day 3: Perl Data Language on the Mac
disable_content_template: 1
tags:
    - MacOS
    - installation
    - SciPDL
author: Boyd Duffee
images:
  banner:
    src: './banner.jpg'
    alt: 'Apple logo'
    data:
      attribution: |-
        <a href="https://www.flickr.com/photos/91645335@N00/2214058583">apple logo</a> by <a href="https://www.flickr.com/photos/91645335@N00">zolierdos</a> is licensed under <a href="https://creativecommons.org/licenses/by-sa/2.0/?ref=openverse">CC BY-SA 2.0</a>
data:
  bio: duffee
  description: 'Installing PDL on MacOS'
---

So, you've got yourself a shiny new MacBook and you want to give PDL a spin.
Lucky you, because the OG author of PDL just got one recently and made an installer to save you a bunch of work.
It works pretty much for Monterey through to Sonoma, buuuuut ... of course my machine happens to be running **_Sequoia 15.1_**,
the latest release, which is not yet listed as having been tested but I believe in Santa and Santa believes in me!
---

I'm a [Homebrew](https://brew.sh/) fan because it simplifies my life when installing third party software on the Mac.
Part of me wants to see what the minimum requirements are to get PDL up and running, but Life's Too Short.

Homebrew has formulae for [PLPlot](https://metacpan.org/pod/PDL::Graphics::PLplot),
[Gnuplot](https://metacpan.org/pod/PDL::Graphics::Gnuplot), GD for graphics,
the [HDF](https://metacpan.org/pod/PDL::IO::HDF) library and [Gnu Scientific Library](https://metacpan.org/pod/PDL::GSL::CDF)
as well as the X11 server needed for the [PGPLOT demos](https://pdl.perl.org/?page=demos/plot2D).
There's a bit of discussion about how [XQuartz](https://www.xquartz.org/) is to be replaced by Apple's Metal,
but for now it looks best to stick with XQuartz.
Go for Maximum Install!

    brew install plplot gnuplot gd hdf5 gsl
    brew install --cask xquartz

Now, does your MacBook have the Intel chip or the newer M1 chip found in post-2020 machines?
Figure that out and go to the [Instructions](https://github.com/PDLPorters/SciPDL/blob/main/README.md),
which consist of downloading the correct release,
open the `.dmg` file, drag and drop the image onto the Applications folder icon that's just popped up.
Done.

(yes, it is that easy)

If you rush to click on the `pdl>` icon and get surprised by this error popup,
it means that you haven't read further down the `README` where it informs you not to panic,
**Edit** and **Save** the file (you won't see a Save button, but you just **⌘ S** or **File > Save**)

![Not authorised message](apple_not_authorised.png "Error message")

For running the PGPLOT demo, you'll need to start the Xserver and if it says it can't connect,
try rebooting, starting the Xserver and entering the pdl shell.
If that still doesn't work,
open a terminal and follow the Running SciPDL instructions to set the environment and type `pdl` or `pdl2` at the prompt.

Parabolas are boring. Here's a cubic instead.

    pdl> use PGPLOT                                                                 
    pdl> use PDL::Graphics::PGPLOT                                                  

    pdl> $ENV{PGPLOT_XW_WIDTH} = 0.3                                                  
    pdl> dev('/XSERVE')                                                             

    pdl> $x = sequence(10)                                                                                                                          
    pdl> $y = $x**3 - 8 * $x**2 + 20                                                

    pdl> points $x, $y

![Plotting a cubic with PGPLOT](cubic_pgplot.png "points along a cubic curve")

You'll have an excellent imagination to see the outline of Santa's pipe in the above plot,
no doubt inspired by a mince pie or two!
