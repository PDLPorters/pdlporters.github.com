---
title: Day 20: Perl Data Language internals
disable_content_template: 1
tags:
    - internals
    - implementation
    - dataflow
author: Ed J
images:
  banner:
    src: './banner.jpg'
    alt: 'Four stroke gasoline engine diagram'
    data:
      attribution: |-
        <a href="https://commons.wikimedia.org/wiki/File:Four_stroke_engine_diagram.jpg">Four stroke gasoline engine diagram</a> by Wapcaplet

data:
  bio: mohawk
  description: 'PDL (Perl Data Language) internals'
---

[PDL](https://pdl.perl.org/) is powerful and has many features. But as
with any complex software system, bugs can happen. Let's learn about two!

---

"Those who love sausages and PDL should watch neither being made,"
said Santa, dreamily.

Santa's chief planner frowned. "Why are all your metaphors food-based?"

2024 is ending as it started: with very subtle PDL dataflow bugs being
discovered, and fixed.

## Winter turning into spring, and a dataflow bug surfaces

The first one came to light in January, when Karl
Glazebrook, the inventor of PDL, [emailed to the pdl-general
list](https://sourceforge.net/p/pdl/mailman/message/58720790/) that
he'd discovered a problem with `clump`. Some clever-ish [finagling with
`git bisect`](https://sourceforge.net/p/pdl/mailman/message/58723923/)
discovered when the problem had occurred. That finagling in full, to
help others another time:

    git bisect start
    git bisect bad # current “master” is bad
    git bisect good 2.025 # tell it it was working as of 2.025
    perl Makefile.PL && time make core && perl -Mblib repro-script; echo $? # kept running this, then:
    git bisect bad # if failing
    git bisect good # if working correctly
    git bisect reset # when finished, to close down the bisect
    # Note the use of “make core” which takes about 2 mins from scratch
    # on my system, vs about 6 to “make” everything, saving lots of time.

Some [further detective
work](https://sourceforge.net/p/pdl/mailman/message/58730063/) lead
to adding what is now the `gv` function in `perldl`, to generate this
diagram showing visually what was going on (the dotted lines show where a
"vaffine" ndarray's data pointer actually points):

[![Steps through a bugged use of `clump`](https://sourceforge.net/p/pdl/mailman/attachment/AS8P194MB1382D0AF017328EF94B519D0827F2%40AS8P194MB1382.EURP194.PROD.OUTLOOK.COM/1/)](https://sourceforge.net/p/pdl/mailman/attachment/AS8P194MB1382D0AF017328EF94B519D0827F2%40AS8P194MB1382.EURP194.PROD.OUTLOOK.COM/1/)

A couple of weeks of deep investigation lead to a fix, as captured on
[a GitHub issue](https://github.com/PDLPorters/pdl/issues/461): this
problem, which had been created in April 2022, then got reported by
two independent sources within a month of each other, nearly two years
later! (Plus [an additional time](https://www.perlmonks.org/?node_id=11153348),
some months earlier in 2023) So what was the problem? PDL's dataflow
happens two ways:

- a "vaffine" ndarray has a pointer directly into
  a different ndarray's data, typically with a "[dope
  vector](https://en.wikipedia.org/wiki/Dope_vector)" to interpret that
  correctly for its purposes; this is barely "flow", because it's just a
  (possibly different) view of the same bytes in memory
- "real" dataflow, when two ndarrays have a "flowing" relationship via
  a flowing transformation (a.k.a. PDL operation or function); when one
  gets changed, the PDL core propagates that change by walking the data
  structure to propagate that change *by marking them as changed* but not
  changing them yet; that real update will only happen when the "changed"
  ndarray gets read from - it's lazy evaluation

The problem here was that the propagation of a `DATACHANGED` message got
incorrectly interrupted by flowing transformations that erroneously set
that they were `DATACHANGED`. The hard bit was identifying that was the
situation. The fix was to make that erroneous setting not happen. The
rest was easy!

## Autumn turning into winter, and another dataflow bug appears

Now it's December, and another bug in dataflow has come to
light. PDL::Complex was officially deprecated in favour of "native
complex" data with PDL 2.055, in 2021. When it was identified that needed
to be released as an independent CPAN module and removed from the upcoming
slimmed-down PDL 2.096, that meant all the modules that use (or rather,
still support) it needed updating. This was easy for
[PDL::LinearAlgebra](https://metacpan.org/pod/PDL::LinearAlgebra), but
[PDL::FFTW3](https://metacpan.org/pod/PDL::FFTW3) was another matter.

It turned out that my implementation of native complex support worked
fine for complex double-precision (`cdouble`), but not single-precision
(`cfloat`), which just produced zeroes, but *only* when turning real
input into complex output. Believe it or not, this was partly due to
dataflow behaviour.

When the PDL core starts up a transformation, it checks the datatypes
of all its inputs and outputs (collectively, "parameters"), and from
those plus the specification for the transformation's parameters,
determines the datatype for the transformation itself. After that,
it then sees which of its parameters need type-converting to match.

- For inputs, that's straightforward; the input gets converted by making it
  an input for a type-converting transformation, and using the output of
  that as the actual input.
- For outputs, it's complicated: currently (as of 2.095, and at the time
  of writing on `git master`) it does exactly the same as the above,
  meaning that that output of the transformation is the output of both
  the main transformation, *and* of the type-conversion - but it "knows"
  of only one parent, which is the type-conversion.

For non-flowing transformations, this actually works in all
circumstances. The transformation is created, then immediately destroyed
which makes all of its updates happen. The output gets written into the
conversion's output, and the propagation of that gets passed backwards
to that conversion's parent, the original passed output.

PDL::FFTW3, because it needs to guarantee which data address it's making
an [FFTW "plan"](https://www.fftw.org/doc/Using-Plans.html) for,
constructs its output, generates/looks up the plan (including for which
precision), and passes them into the transformation, triggering the
above type behaviour. It turns out that the type-establishing behaviour
has a bug when a parameter is marked as the "complex" version of the
transformation's datatype, and a complex ndarray is provided for
that. That bug means the transformation's datatype is established wrongly,
which means type-conversion is needed for all the parameters. Because
the type-conversion stuff works fine for non-flowing transformations
(and PDL::FFTW3's operations are non-flowing), this almost works. But
not quite:

- for single-precision, the plan is generated for that, and it's used
  in the transformation's implementing code with no regard for that
  transformation's datatype
- the input data is converted into double-precision, but FFTW3 interprets
  those bytes as single-precision, producing extremely small (actually
  subnormal, order of `1e-315`) values, which the type-conversion turns
  back into single-precision - but single-precision can't go smaller than
  `1e-38`, so it's precisely zero

The latest version of PDL::FFTW3 has a workaround for this, by
substituting its own modification for the type-establishing code that
avoids the bug. When PDL 2.096 is released, this substitution can
be removed. But how is this a dataflow bug?

When capturing this as behaviour in main PDL, the best way to test for
this is to examine the passed-in output ndarray, to check it *doesn't*
have a type-conversion on it. But because non-flowing transformations
get immediately executed and destroyed (at least until
[loop fusion](https://github.com/PDLPorters/pdl/issues/349) comes in),
I needed to make a flowing version using the recently-added `flowing`
method. This also showed zeroes in the output, despite FFTW3 not being
involved!

It's turned out this is because of the double-parent problem mentioned
in the type-conversion process above:

- the operation's flowing input gets mutated
- this propagates a `DATACHANGED` to the outputs, but nothing else
  happens due to lazy evaluation
- the transformation's output is here the output of the conversion
- when the supplied output is read, it's not marked as changed, and
  even if it were, there's no route for it to "pull" from the original
  transformation, since that one's output doesn't know about it as a parent

Currently, it looks like the way forward will be to change outputs'
type conversion so that the conversion's inputs and outputs (and the
"from" and "to" datatypes) get switched, then the input of that gets
put as the output of the flowing transformation. This means PDL needs
to now prevent supplied outputs that need converting, but already have a
"parent" input.
[This is causing some complications](https://github.com/PDLPorters/pdl/issues/511)!

Specifically, this won't work:

    float('1 2 3')->slice('1') .= double(5); # left-hand side gets converted

But a bit more surprisingly, nor will this, because `float` is a
higher-numbered type than `indx`, so in the current algorithm it would
"win", forcing a conversion on the output:

    indx('1 2 3')->slice('1') .= 5.5; # right-hand gets made into `float`

One possibility is to make PDL operations not immediately and blindly
turn their inputs into an ndarray of the lowest-numbered type that can
contain them, but to ask the transformation what types it wants its Perl
scalar arguments to be. This would open the possibility of allowing all-Perl
values to get processed directly by an added version of the compiled code,
without needing to make any ndarrays at all.

Another possibility is to be more careful in the type-detecting, and
prioritise outputs; after all, it is they that get the final result;
why not convert the inputs instead?

Another glorious day with PDL!
