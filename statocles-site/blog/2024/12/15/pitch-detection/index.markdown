---
title: Day 15: Pitch detection
disable_content_template: 1
tags:
    - signal processing
    - phonetics
    - speech
    - sound
author: José Joaquín Atria
images:
  banner:
    src: 'banner.jpg'
    alt: A close up of a person's ear
    data:
      attribution: |-
        <a href="https://www.pexels.com/photo/close-up-photo-of-a-person-s-ear-8092973/">Close-Up Photo of a Person's Ear</a> Image Credit: Kaboompics.com, <a href="https://www.pexels.com/license/">free to use</a>
data:
  bio: jjatria
  description: |
    An explanation of (part of) Praat's pitch detection algorithm using PDL
---

In a previous life I spent most of my time (free and otherwise) thinking about
phonetics and the analysis of speech sounds. Like most scientific research, it
was slow and tedious and oddly rewarding.

Back then I was already in a steady drift towards spending more time playing
with computers than with my research, so a lot of my efforts went into
studying [Praat](https://www.fon.hum.uva.nl/praat), a piece of software you've
almost certainly never heard of, but that has probably been used in most of
the phonetics research you've also never heard of.

---

One of Praat's biggest claims to fame is its [pitch detection algorithm],
which does a remarkably good job at estimating the [fundamental frequency]
(or f₀) of speech sounds. This is essential for any kind of research on the
intonation of spoken languages (called "prosody"), and it is difficult for
primarily two reasons:

[pitch detection algorithm]: https://www.fon.hum.uva.nl/praat/manual/FAQ__Pitch_analysis.html
[fundamental frequency]: https://en.wikipedia.org/wiki/Fundamental_frequency

1.  Speech sounds are made of a combination of several harmonic frequencies,
    which makes the task not just about frequency detection, but about
    detecting the right one.

2.  Speech sounds change rapidly, so we have only a small amount of unstable
    data for any frequency at any point in time.

Praat's algorithm corrects for these by making a number of assumptions about
the sounds it deals with, most of which are tied to the fact that speech
sounds are generated by the human vocal tract. So, for example, while speech
sounds change all the time, there is a limit to how quickly the vocal tract
can make those changes, which means that on a small enough time scale, we
should be able to treat speech sounds as if they were stable. Praat refers
to these windows of analysis as "frames".

This article (which is based on [a similar one] I wrote in 2012 using R) will
go over the core part of the algorithm as described in [Boersma (1993)], and
since this is the PDL Advent Calendar, we'll be using PDL for illustrating
each step and generating the figures. I'll be showing the relevant bits of
code at each step, but you can also download [a file with all of the code] in
context.

[boersma (1993)]: http://www.fon.hum.uva.nl/paul/papers/Proceedings_1993.pdf
[a similar one]: https://pinguinorodriguez.cl/blog/pitch-in-praat
[a file with all of the code]: ./pitch-detection.pl

The plots in this article have also been plotted with PDL using
[PDL::Graphics::Gnuplot]. In the interest of clarity, I won't show here the
code used to generate them, but always remember that all of it is available
in [the file I just mentioned][a file with all of the code].

[pdl::graphics::gnuplot]: https://metacpan.org/pod/PDL::Graphics::Gnuplot

To represent our speech sound we'll use a complex sinewave with two frequency
components: one at 140Hz to represent our fundamental frequency, and one to
represent a loud harmonic an octave higher at 280Hz. In this case, our frame
is long enough to hold three periods.

    my $f0 = 140;
    my $sampling_rate = 44100;
    my $periods_per_frame = 3;

    my $samples = ( 1 / $f0 ) * $sampling_rate * $periods_per_frame;
    my $x = sequence $samples;

    # A complex sine wave with a component at the desired target frequency
    my $wave = 1 + 0.3 * sin( 2 * PI * $f0 * $x / $sampling_rate );

    # with a loud component an octave higher
    $wave *= sin( 2 * PI * ( 2 * $f0 ) * $x / $sampling_rate );

    # normalised to a range of -1 .. 1
    $wave /= max $wave;

<figure>
 <figcaption>The sound in the analysis window</figcaption>
 <img src="./figure-1.svg"
  alt="Three cycles of a complex sine wave, with a peak amplitude of 1 and
  starting and ending at 0. The horizontal axis is 945 samples long" />
</figure>

In this case the analysis window perfectly lines up with the zero-crossings of
the wave, which means we don't have any intensity peaks at the edges. But this
is not guaranteed to happen, so to avoid this the first thing we'll do is
filter the window.

Different filters will have different effects on the analysis, and indeed
Praat can be configured to use either a [Hann] or a [Gaussian] window. The one
used by default is the Hann window (which is referred to as "Hanning" in the
article and by Praat), so that's the one we'll use in this article.

[hann]: https://en.wikipedia.org/wiki/Hann_function
[gaussian]: https://en.wikipedia.org/wiki/Gaussian_function

So if we assume for example that we are only interested in frequencies above
120Hz, and we are going with _at least_ three periods per frame, we'll need a
window that is at least 3 * ( 1 / 120 ) or 0.025 seconds long.

To calculate the Hann window, we can use [PDL::DSP::Windows]:

    my $filter = window $samples, 'hann';

[pdl::dsp::windows]: https://metacpan.org/pod/PDL::DSP::Windows

<figure>
 <figcaption>The Hann filter function</figcaption>
 <img src="./figure-2.svg"
  alt="A Hann filter, tracing a bell curve asymptotically approaching 0 on
  both ends" />
</figure>

And we apply this filter to our sound wave by multiplying both curves:

    my $filtered = $wave * $filter;

<figure>
 <figcaption>The filtered window</figcaption>
 <img src="./figure-3.svg"
  alt="A Hann-filtered complex sine wave, with an amplitude close to 0 on
  each end and 1 in the middle" />
</figure>

So far this has mostly been preparing our data, but now we come to the meat
and potatoes of the process.

To detect a sound's pitch Praat uses [autocorrelation], comparing each frame with
itself. An autocorrelation plot shows the degree to which the compared curves are
related on the Y-axis, and the time lag for each comparison on the X-axis. If
the curve is periodic, then the autocorrelation curve should have a peak when the
lag is equal to the original curve's period.

[autocorrelation]: https://en.wikipedia.org/wiki/Autocorrelation

We can calculate the wave's autocorrelation with the `acf` method provided by
importing [PDL::Stats::TS]. Since we are not providing any arguments, the
number of lags will default to one less than the number of samples in the
ndarray, which is exactly what we want:

[pdl::stats::ts]: https://metacpan.org/pod/PDL::Stats::TS

    my $filtered_acf = $filtered->acf;

<figure>
 <figcaption>Normalised autocorrelation of the filtered sound</figcaption>
 <img src="./figure-4.svg"
  alt="An autocorrelation plot with the Y-axis ranging from 1 to -1, showing a
  series of peaks with decreasing intensities. The line starts at the top and
  falls back and up again with a first peak on sample 157, and a second
  smaller peak on sample 316" />
</figure>

The autocorrelation is highest at a time lag of 0, when the curve is being
compared with itself, so we need to look for peaks that are greater than 0 for
significant periodicity. However, in this case, since we are working with a
complex sound wave with a loud harmonic, the autocorrelation curve shows a
"false" peak before the time lag that we know is the sound's actual
fundamental frequency, which is aligned with a lower peak.

In order to correct for this, Boersma's algorithm divides the filtered signal
by what it describes as the normalised autocorrelation curve of the window
function, which is calculated as follows:

    my $filter_acf
        = ( 1 - ( abs($x) / $samples ) )
        * ( 2 / 3 + 1 / 3 * cos( 2 * PI * $x / $samples ) )
        + ( 1 / ( 2 * PI ) )
        * sin( ( 2 * PI * abs($x) ) / $samples );

<figure>
 <figcaption>Normalised autocorrelation of the window function</figcaption>
 <img src="./figure-5.svg"
  alt="Half of a bell curve, starting from 1 and curving downwards to the right,
  asymptotically approaching 0 in the end" />
</figure>

The result of dividing the autocorrelation of the filtered sample and that of
the filter is an estimate of the autocorrelation of the original signal, which
Boersma claims to be both robust and better suited for the analysis of speech
signals than previous methods used.

Note that this estimate gets increasingly unreliable after roughly half the
length of the analysis window, so the algorithm discards any data in the
second half ([Boersma, 1993][boersma (1993)]).

    my $estimated_acf = $filtered_acf / $filter_acf;

    # Discard second half
    my $slice = int $samples / 2;
    $estimated_acf->slice( "$slice:" ) .= nan;

    # Normalise to -1 ... 1 range
    $estimated_acf /= max $estimated_acf;

<figure>
 <figcaption>Estimated autocorrelation of the original signal</figcaption>
 <img src="./figure-6.svg"
  alt="Three cycles of a sinusoid wave, half the length of the ones shown
  before, starting on a peak at a magnitude of 1. The second peak is slightly
  lower than the first. The third peak, which is slightly higher than the
  second, is marked with a blue line on sample 316" />
</figure>

By finding the maximum at a time lag greater than zero in this curve, we can
get an estimate of the pitch of the original signal converting from samples
back to Hz:

    my ($index) = @{ ( 20 + $estimated_acf->slice('21:')->maximum_ind )->unpdl };
    my $foo = $index / $sampling_rate;
    my $result = 1 / ( $index / $sampling_rate );
    say "f0 = $result";
    # OUTPUT: f0 = 140.445859872611

This covers equations 5 through 9 of those described in [Boersma (1993)], but
it is far from the entire algorithm. This part is used to calculate pitch
"candidates". We have not covered here some of the preprocessing done to the
sound before separating it into individual frames, or the path finding that is
later done on the pitch candidates to trace a final pitch curve, but this is
probably a good place to stop for now.

---

  * Boersma, P. (1993) _Accurate short-term analysis of the fundamental
    frequency and the harmonics-to-noise ratio of a sampled sound_.
    IFA Proceedings 17: 97-110
