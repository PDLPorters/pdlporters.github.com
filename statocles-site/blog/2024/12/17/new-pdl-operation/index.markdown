---
title: Day 17: New operations for Perl Data Language
disable_content_template: 1
tags:
    - inline-pdlpp
    - pptemplate
    - create operation
author: Ed J
images:
  banner:
    src: './banner.jpg'
    alt: 'Prometheus bringing fire to mankind'
    data:
      attribution: |-
        <a href="https://commons.wikimedia.org/wiki/File:Heinrich_fueger_1817_prometheus_brings_fire_to_mankind.jpg">Prometheus Brings Fire to Mankind</a> by Heinrich Füger, circa 1790

data:
  bio: mohawk
  description: 'New operations for PDL (Perl Data Language)'
---

If you want to create new [PDL](https://pdl.perl.org/) operations, it's easy! You can make an ad-hoc one with
[Inline::Pdlpp](https://metacpan.org/pod/Inline::Pdlpp), and expand it (or
just start) by using [pptemplate](https://metacpan.org/pod/pptemplate).
---

"Genetic engineering?" Santa's chief planner wasn't
[fully losing her mind](https://www.youtube.com/watch?v=AeKizzQpPpY&t=199s),
but it was visibly an effort.

"The presents stuff doesn't take up the whole year!" Santa said,
defensively. If they were going to analyse genetic data, they might as
well do it efficiently. Perhaps PDL could help?

As [discussed recently on
PerlMonks](https://www.perlmonks.org/?node_id=11162765), processing
data in a highly efficient way is already possible using existing
PDL operations, and it's easy to engage the [automatic POSIX
threading](https://metacpan.org/pod/PDL::ParallelCPU) too.

Those existing operations are made with
[PDL::PP](https://metacpan.org/pod/PDL::PP), which allows making
type-generic, n-dimensional operations for PDL. But taking the first
step can feel a bit intimidating. Inline::Pdlpp allows you to make a
script with a PP operation in minutes.

[Inline::Pdlpp](https://metacpan.org/pod/Inline::Pdlpp)'s SYNOPSIS has a
working example of making a new PDL operation for processing genetic data:

    use strict; use warnings;
    use PDL;
    use Inline Pdlpp => 'DATA';
    # make data with: echo -n 'ATCGZATCG' >input.data
    # use it with aa_to_int.pl input.data
    my $file; ($file = shift, -f $file) || die "Usage: $0 filename";
    my $size = -s $file;
    my $pdl = zeroes(byte, $size);
    ${$pdl->get_dataref} = do { open my $fh, $file or die "$file: $!"; local $/; <$fh> };
    $pdl->upd_data;
    $pdl->inplace->aa_to_int;
    print $pdl, "\n";
    __DATA__
    __Pdlpp__
    pp_def('aa_to_int',
     Pars => 'i();[o] o()',
     GenericTypes => ['B'],
     Inplace => 1,
     Code => <<'EOF',
    switch($i()) {
     case 'A': $o() = 0; break;
     case 'T': $o() = 1; break;
     case 'C': $o() = 2; break;
     case 'G': $o() = 3; break;
     default: $o() = 255; break;
    }
    EOF
     Doc => "=for ref\n\nConvert amino acid names to integers.\n",
    );

A further improvement to that script might be to mark those unknown
letters as [bad values](../../10/bad-values/):

    $pdl->inplace->setvaltobad(255);

Or, the operation itself could set the values bad:

    $pdl->badflag(1);
    $pdl->inplace->aa_to_int;
    # ...
    pp_def('aa_to_int',
     Pars => 'i();[o] o()',
     GenericTypes => ['B'],
     Inplace => 1,
     HandleBad => 1,
     Code => <<'EOF',
    switch($i()) {
     case 'A': $o() = 0; break;
     case 'T': $o() = 1; break;
     case 'C': $o() = 2; break;
     case 'G': $o() = 3; break;
     default: PDL_IF_BAD($SETBAD(o()),$o() = 255); break;
    }
    EOF
     Doc => "=for ref\n\nConvert amino acid names to integers.\n",
    );

To turn this into a fully-fledged PDL module, use
[pptemplate](https://metacpan.org/pod/pptemplate):

    $ pptemplate PDL::MyModule

Put your `pp_def` code into `mymodule.pd` (or, in the new scheme as of
PDL 2.096, `lib/PDL/MyModule.pd`), make some tests, write documentation,
and publish to the world on CPAN!

## Further resources

Be sure to check the documentation for
[PDL::PP](https://metacpan.org/pod/PDL::PP), to see further
possibilities. You can supply additional keys to the `pp_def`
call to control whether to disable POSIX threading (which is
on by default, but some C libraries can't handle that). Or you
can automatically add lvalue processing, as with [the slice
operation](https://metacpan.org/pod/PDL::Slices#slice).
