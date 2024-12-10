---
title: Day 13: The Sound of Perl
disable_content_template: 1
tags:
    - sound
author: Harald Jörg
images:
  banner:
    src: './banner.jpg'
    alt: 'Score sheet for "In dulci jubilo"'
    data:
      attribution: |-
        Banner image From <a href="https://www.cpdl.org/wiki/">ChoralWiki</a>, available under the <a href="https://www.cpdl.org/wiki/index.php/ChoralWiki:CPDL">Choral Public Domain License</a>.  Copyright © 2016 by CPDL.
data:
  description: 'Creating Sound with PDL (Perl Data Language)'
---

If you can not sing nor play an instrument but want to make a contribution, let [PDL](https://pdl.perl.org/) help you out!
---

What is the sound of Perl? Is it not the sound of a wall that people
have stopped banging their heads against?  -- Larry Wall

Well, in this season many people have different sounds in their minds.
So, let's see whether we can use Perl to create sound.  Or, more
precisely, we will create the data representing sound and write them
to a file which can be used by the media player of your choice.

## Getting Started

Sound is perceived as change of air pressure over time.  For a musical
note the change is periodic, so as a simple case we can use a sine
function.  We sample the sine function at regular intervals and store
the result in a one-dimensional PDL ndarray.  Like audio CDs, we use
44100 samples per second.

    # Preamble
    use 5.036;
    use PDL;
    use constant PI   => atan2(0,-1);
    use constant RATE => 44100;

    # This subroutine is where the fun will happen.
    # Return N_SAMPLES for a wave with FREQUENCY
    sub samples ($n_samples, $frequency) {
        my $phase   = sequence($n_samples) * 2 * PI * $frequency / RATE;
        my $samples = sin($phase);
        return $samples;
    }

The `sequence` constructor of PDL builds regular intervals which we
adjust for the rate and the desired frequency.  Also, PDL brings its
own `sin` function which operates on ndarrays.

For output, we use the
[WAV](https://ccrma.stanford.edu/courses/422-winter-2014/projects/WaveFormat/)
file format which is a binary, uncompressed audio format.  We prepare
our samples by converting them to 16bit integers using the `short`
constructor, and we make sure that they use the full value range for
"short" integers.  The method `get_dataref` returns a reference to a
Perl scalar which holds the _binary_ array which we can directly print
to a WAV file:

    sub prepare ($samples) {
        my $amplitude = 2**15-1;
        my $max = max(abs $samples);
        my $sound16 = short($samples / $max * $amplitude);
        return $sound16->get_dataref;
    }

The actual WAV formatting needs some bookkeeping but isn't all that
interesting:

    sub write_wav ($data,$to) {
        open (my $handle, '>', $to)
            or die "Could not write to '$to': '$!'";
        binmode $handle;
        print $handle 'RIFF';
        my $header = 'WAVE';
        $header .= 'fmt ';
        $header .= pack('l',16);
        $header .= pack('ssllss', 1, 1, RATE, RATE * 2, 2, 16);
        $header .= 'data';
        print $handle pack('l',length($data) + length($header) + 4);
        print $handle $header;
        print $handle pack('l',length($data));
        print $handle $data;
        close $handle;
    }

Now we can create our first WAV file:

    my $samples = samples(44100,440);

    my $path = 'pdlsound.wav';
    my $dataref = prepare($samples);
    write_wav($$dataref,$path);

<audio controls>
  <source src="sine.wav" type="audio/wav">
</audio>

We can now feed the file pdlsound.wav to a media player.  Of course, that
sounds ... pretty dull and boring.

### A Short Digression

Before spicing it up, lets digress a bit and see what else we can do
with our samples.  This requires the CPAN distributions
[Prima](https://metacpan.org/pod/Prima) and
[PDL::Graphics::Prima::Simple](https://metacpan.org/dist/PDL-Graphics-Prima)
and its dependencies.  To install Prima, we need to provide some
developement libraries.  The Prima maintainer Dmitri Karasik has
compiled instructions for various platforms in the distribution's
[Readme.md](https://metacpan.org/release/KARASIK/Prima-1.74/source/README.md).

With these modules installed, we add one line to the preamble, which
now reads:

    use 5.036;
    use PDL;
    use PDL::Graphics::Prima::Simple; # <--- added
    use constant PI   => atan2(0,-1);
    use constant RATE => 44100;

Using that module is as simple as this: We plot two complete periods
of our sine wave by adding two lines at the end of our main program.
The `slice` method allows to select parts of a ndarray.

    my $samples_per_period = RATE/440;
    line_plot($samples->slice([0,2*$samples_per_period]));

![Two periods of a sine wave](sine.png)

An interesting visualization of sound is its power spectrum.  We
obtain it by using [PDL::FFT](https://metacpan.org/pod/PDL::FFT) which
comes with PDL (with a minor change you could also use
[PDL::FFTW3](https://metacpan.org/pod/PDL::FFTW3)) in a short
subroutine:

    sub spectrum ($samples) {
        use PDL::FFT;
        my $frequencies = float($samples);
        my $n_samples = $samples->dim(0);
        my $limit = 0.5 * $n_samples;
        realfft($frequencies);
        my $real = $frequencies->slice([0,$limit-1]);
        my $imag = $frequencies->slice([$limit,$n_samples-1]);
        return 2 * sqrt($real*$real + $imag*$imag) / $n_samples;
    }

And, in our main program, we use it:

    line_plot(spectrum($samples));

![Spectrum of a sine wave](sine_spectrum.png)

That plot is not very informative.  But wait: These plots are
interactive!  Using the right mouse button we can mark a rectangle to
zoom into the interesting region near the left edge of the plot.  The
plot can also be resized, and the right-mouse context menu allows to
export the plot to an image file, which is how the images in this
article were created.

![Spectrum of a sine wave, zoomed](sine_spectrum_zoomed.png)

So yeah, we get a sharp peak at 440Hz, which should come as no
surprise because this is exactly the frequency we used.

## Stepping Up

### Playing With Waveforms

Now let's replace the sine function by a different code to create
samples:

    sub samples {
        my ($n_samples,$frequency) = @_;
        my $samples = sequence($n_samples) * $frequency / RATE;
        $samples    -= short $samples; # drop the integer part
        $samples    *= 2;
        $samples    -= 1;
        return $samples;
    }

<audio controls>
  <source src="sawtooth.wav" type="audio/wav">
</audio>

This sounds a bit ... iffy.  But why?

Let's use our visualization plots to examine the situation:

![Two periods of a sawtooth wave](sawtooth.png)
![Spectrum of a sawtooth wave](sawtooth_spectrum.png)

So this is a sawtooth wave, and the spectrum shows that this waveform
brings a complete set of overtones.  An infinite number of overtones.
We should not need to care, human hearing stops at around 20000Hz.  Or
should we?  Do we see some noise along the x axis?  Let's zoom in:

![Spectrum of a sawtooth wave, zoomed](sawtooth_spectrum_zoomed.png)

Wow, what a mess!  The overtones seem to be bouncing back and forth?
That's exactly what happens, and it is a consequence of our digital
sampling method.  Remember: We are using 44100 samples per second.  At
a frequency of 22050Hz we are left with only two samples per period.
Any higher frequency 22050+x gives the same sample values as 22050-x.
So this is what where the audible noise comes from.

We could reduce the noise by increasing the sample rate, but we'll
just refrain from using sawtooth waves instead, and build waves by
adding sine functions.  Here's something that sounds like a church
organ. Code, audio sample, waveform and spectrum plot, as usual:

    sub sine_wave ($n_samples, $frequency) {
        my $phase   = sequence($n_samples) * 2 * PI * $frequency / RATE;
        my $samples = sin($phase);
        return $samples;
    }
    sub harmonic ($n_samples,$base_frequency,$amplitudes) {
        my $samples = zeroes($n_samples);
        my $overtone = 1;
        for my $amplitude (@$amplitudes) {
            my $frequency = $base_frequency * $overtone++;
            last if $frequency >= 22050;
            $samples += $amplitude
                * sine_wave($n_samples, $frequency);
        }
        return $samples;
    }

    my @organ = (1,1,0.2,0.8,0,0,0,0.6);
    my $samples = harmonic(RATE,440,\@organ);

<audio controls>
  <source src="harmonic.wav" type="audio/wav">
</audio>

![Two periods of a "organ" wave](harmonic.png)
![Spectrum of a "organ" wave](harmonic_spectrum.png)

The set of overtones and their amplitudes is an important component of
the timbre of a musical note.

### Chords and Melodies

Creating a chord is a variation of the subroutine just shown.  For a
chord, we don't need different amplitudes for the notes, but we allow
frequencies which are not an integral multiple of the base frequency.
Two notes sound "smooth" together if dividing their frequencies gives
a rational number with a small numerator and denumerator.  Let's do
this on top of the `harmonic` routine.

    sub chord ($n_samples,$base_frequency,$harmonic,$factors) {
        my $samples = zeroes($n_samples);
        for my $factor (@$factors) {
            my $frequency = $base_frequency * $factor;
            next if $frequency >= 22050;
            $samples += harmonic($n_samples,$frequency,$harmonic);
        }
        return $samples;
    }
    my $samples = chord(RATE,220,\@organ,[1,5/4,3/2,2]);

For a melody, we concatenate the samples for each note, using PDL's
`append` method.  We can do it on top of the chords subroutine:

    my $samples = pdl([]);
    my @chords = ([1,5/4,3/2],[1,4/3,5/3],[9/8,3/2,15/8],[1,3/2,5/4,2]);
    for my $chord (@chords) {
        $samples = $samples->append(chord(RATE,440,\@organ,$chord));
    }

<audio controls>
  <source src="cadenza.ogg" type="audio/ogg">
</audio>

### Effects: Volume Modulation

We can easily modulate the volume of our notes by multiplying them
with an approporate ndarray of the same length.  Here are two examples:


  * The amplitude of a plucked string of a guitar decreases over time.

        my $samples = sine_wave(RATE,440)
            * (1+sin(20*sequence(RATE)/RATE))/2;

    <audio controls>
      <source src="plucked.wav" type="audio/wav">
    </audio>

  * A slow, periodic change of the amplitude (tremolo) can be achieved
    in two different ways.  First, let's apply a sine function to the
    amplitude of the samples.  This method works for any batch of
    samples, there's no need to know its frequency nor any other
    property.

        my $samples = sine_wave(RATE,440)
            * (1+sin(20*sequence(RATE)/RATE))/2;

    <audio controls>
        <source src="volume_mod.wav" type="audio/wav">
    </audio>

    ![Spectrum of a volume modulation](volume_mod.png)

    The spectrum, zoomed around the frequency of this note,
    demonstrates the second method to get the same effect: Just add
    vibrations with frequencies close to each other!

### Effects: Frequency Modulation

A periodic frequency modulation or vibrato is not as straightforward
as a volume modulation.  Still, we can do it without knowing details
about the samples or changing the functions which create them: We warp
the time so that our samples are no longer associated with regular
time intervals.  Then we use PDL's `interpolate` function to adjust
the samples to the regular time intervals we need.


    sub apply_vibrato ($samples,$frequency,$range) {
        my $n_samples = $samples->dim(0);
        my $timewarp = sequence($n_samples)
            + $range * sin(sequence($n_samples) * 2 * PI * $frequency / RATE);
        my $norm = ($n_samples-1) / $timewarp->at(-1);
        $timewarp *= $norm;
        my ($warped,$err) = interpolate($timewarp,
                                        sequence($n_samples),$samples);
        warn "We have errors: ", $err->sum  if $err->sum > 0;
        return $warped;
    }

    my $samples = sine_wave(RATE,440);
    my $vib_frequency = 5;
    my $vib_range = 50;
    $samples = apply_vibrato($samples,$vib_frequency,$vib_range);

<audio controls>
    <source src="v440_50_5.wav" type="audio/wav">
</audio>

I admit that I did not expect the spectrum to look like this:

![Spectrum of a vibrato effect](v440_50_5.png)

## Putting It All Together

We have only scratched a tiny portion of digital audio processing.  I
did not intend to build a digital audio workstation.  But then, I had
a lot of fun learning PDL by manipulating simple, one-dimensional
arrays.  So here's an application of the techniques described in this
article to create 1701055 samples, or 38 seconds.

<audio controls>
    <source src="idj.ogg" type="audio/ogg">
</audio>

