---
title: Day 12: 3D visualization of scalp electrode sites can be done with Perl
disable_content_template: 1
tags:
    - visualization
    - MacOS
    - TriD
    - 'basic matrix operation'
    - 'ndarray operation'
author: Shugo SUWAZONO
images:
  banner:
    src: 'banner.jpg'
    alt: 'EEG Recording Cap'
    data:
      attribution: |-
        <a href="https://commons.wikimedia.org/w/index.php?curid=24805878">EEG Recording Cap</a>" by Chris Hope is licensed under <a href="https://creativecommons.org/licenses/by/2.0/?ref=openverse">CC BY 2.0</a> and did not originate from the author's research.
data:
  bio: shugo
  description: 3D visualization of scalp electrode sites for EEG
---

Seeing is believing. A better presentation can more easily persuade people with your story.
I, working as an EEG ([electroencephalography](https://en.wikipedia.org/wiki/Electroencephalography)) researcher, sometimes need to consider the location of its origin, referring to the electrode positions used while recording the data.
This is because the scalp distribution of the recorded EEG potential (amplitude) can be affected by how the electrodes align with each other.
Here I need to better visualize 3D locations of electrode positions.

Let’s try visualization of those electrode positions using Perl, in 3D manner, where you can change the camera position to watch them from your favorite angle/direction!
---

I took three steps to realize such a visualization.
The first one is to parse the electrode position file, the second to construct its contents in the way I
want to call/name, connecting its contents to the way I would prefer to reuse/call.
The third is the actual visualization, using the [PDL::Graphics::TriD](https://metacpan.org/pod/PDL::Graphics::TriD) module.

## Step 0 - Preparation
These are the needed modules to be installed:
- PDL
- PDL::NiceSlice
- PDL::Graphics::TriD

My environment FYI: MacOS Ventura 13.4, Xcode 14.3.1, MacPorts 2.10.5

## Step 1 - Parsing
The first step is parsing the file to make a 2D array using the subroutine `parse_ASCII`.
I wrote that subroutine written myself. Yes, this is kind of “re-inventing the wheel”. There are so many shorter and smarter modules you can find on CPAN! Anyway in many cases, I would re-use values returned by my subroutine, later in my script.

## Step 2 - Make a table
Next, construct an accessible table using the subroutine `parse_ELEC_POS3D_ASA_4AdventCalendar`.
The input file has **xyz** coordinates of each electrode in the upper half of the file, and labels (electrode names) in the lower part of the file.
So I need to connect/associate the labels to the corresponding coordinates. This kind of job is one of the Perl’s strongest suits (^^).
And we can build very flexible data structure in one construct, like a combination of dictionaries (a _hash_ in Perl terminology) and numerical arrays.

## Step 3 - Add color
Finally in the subroutine `disp_3d`, define the colors and draw the positions in 3D!
Now the time to define colors of each electrode. In this report, the color is defined by its coordinates, and of course you can use EEG voltage if you want. Then call the actual visualization of the 3D window.
There should appear one window [with small square tiles](SC4PerlAdventCalendar01.png), corresponding to each electrode position. You can drag and change the rotation of the “helmet” like point-clouds!
If you click on the window and press **q** on your keyboard, the second figure will appear [with electrode name labels](SC4PerlAdventCalendar2.png).
These labels also move around with each corresponding tile (electrode) while you drag the “helmet”!

![SC4PerlAdventCalendar01](SC4PerlAdventCalendar01.png)

## Putting it all together
How to execute the above 3 steps?

Place the electrode position file [classic10_20.elc](classic10_20.elc) and the Perl script file
[PerlAdventCalendar2024Dec.Shugo.pl](PerlAdventCalendar2024Dec.Shugo.pl) in the same directory on your machine.
You need to open up a terminal.app, and move to that directory where the above two files are located.
Then type

    $ perl PerlAdventCalendar2024Dec.Shugo.pl classic10_20.elc

Now you will see a X window with 3D locations you decoded. Have fun with dragging the “helmet”!

![SC4PerlAdventCalendar2](SC4PerlAdventCalendar2.png)

### Next step(s)
It will be possible to make voltage mapping figures projected on the scalp hopefully!

## References

- Shugo Suwazono, Hiroshi Arao.
[A newly developed free software tool set for averaging electroencephalogram implemented in the Perl programming language.
](https://pubmed.ncbi.nlm.nih.gov/33294707/) Heliyon. 2020;6(11):e05580.
doi: 10.1016/j.heliyon.2020.e05580. PMID: 33294707 PMCID: PMC7701343
