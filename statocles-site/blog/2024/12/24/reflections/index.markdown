---
title: Day 24: Perl Data Language reflections
disable_content_template: 1
tags:
    - community
    - API
author: Ed J
images:
  banner:
    src: './banner.jpg'
    alt: 'Four stroke gasoline engine diagram'
    data:
      attribution: |-
        <a href="https://en.wikipedia.org/wiki/File:Mount_Hood_reflected_in_Mirror_Lake,_Oregon.jpg">Oregon's Mt. Hood Territory</a> - public domain

data:
  bio: mohawk
  description: 'PDL (Perl Data Language) reflections'
---

[PDL](https://pdl.perl.org/) is great to use. The community is pretty
great, too!

---

Making this Advent calendar has been an adventure (ha!). As well as a
couple of articles from me, there have been many from Boyd, who also
shepherded this thing from inception onwards.

We've also had contributions from users both long-standing and also
new. That reflects PDL itself, which from the moment it started had an
active, some might say opinionated, community of contributors. Since
the originator of PDL, Karl Glazebrook, gets pride of place with an
article tomorrow (Xmas day), I won't steal any of his thunder.

That variety extends to the type of contribution made: from making
continuous integration that has radically reduced the rate of bugs
(hi Zaki!) to adding support for PDL without making their module depend
on PDL. It's been a lot of fun supporting this community, and I intend
to go on doing that.

## Math::3Space

That last one I'm going to unpack a bit: the module in question is
[Math::3Space](https://metacpan.org/pod/Math::3Space). I was interested
in some PerlMonks articles mentioning it, and similar 3D calculations,
so I wanted to make sure PDL wasn't missing out any 3D goodness.

I made a few pull requests, most notably
[this one](https://github.com/nrdvana/perl-Math-3Space/pull/8) that
proposed a complete PDL implementation. As of this writing, it's still
open, because the author, Michael, chose a different approach. Preferring
his modules to have very, very
[minimal dependencies](https://www.perlmonks.org/?node_id=11163301),
he instead had his XS code know about that module's objects, but *then
also* know about PDL objects. On seeing one of those, it would call
Perl methods on it, to see how many dimensions it has, and if few,
to call PDL's `list` method to just get the raw data.

As shown in discussion on that pull request, for the finite things the
module is for, it's extremely fast, indeed for those small things it's
quicker than PDL. Without having done a full performance evaluation,
I am certain that PDL will be quicker for really big 3D calculations,
partly because it could use a GPU-using LAPACK implementation through
[PDL::LinearAlgebra](https://metacpan.org/pod/PDL::LinearAlgebra),
or even just using the [automatic POSIX
threading](https://metacpan.org/pod/PDL::ParallelCPU) that's available
on any POSIX platform.

The discussion, and ideas that came from it, was really enjoyable, and
lead to what I believe is fixing / finishing an idea
that had been discussed in very early PDL:
"[flowing families](https://metacpan.org/pod/PDL::Dataflow)".

## PDL::Parallel::threads

Speaking of getting inspiration from collaboration,
another module where something similar happened was
[PDL::Parallel::threads](https://metacpan.org/pod/PDL::Parallel::threads).
At first I couldn't see what it brought to PDL, until Mario Roy's
[incredibly thorough
investigation](https://github.com/PDLPorters/pdl/issues/385) and
comparison of different ways of doing parallel matrix computation. This
module not only allows clever techniques for doing that quickly, but
*also* would allow you to have a graphical user interface running all
at the same time!

This year (2024), I thought I would see if that module could be made
simpler, by adding some support for it in main PDL. It turns out it could,
and its author (David Mertens) was kind enough to grant me permission
to include it in main PDL. In an example of PDL synergy, the techniques
used to provide PDL::Parallel::threads with the facilities it
needed in core PDL, almost immediately helped fix a long-standing
[problem](https://github.com/PDLPorters/pdl/issues/501) with
[PDL::IO::FlexRaw](https://metacpan.org/pod/PDL::IO::FlexRaw).

Teamwork truly makes the dream work!
