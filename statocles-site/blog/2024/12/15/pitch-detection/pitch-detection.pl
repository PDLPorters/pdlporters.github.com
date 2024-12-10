#!/usr/bin/env perl

# A demonstration of part of Praat's pitch detection algorithm in Perl
# Written by José Joaquín Atria (December 2024)
# Tested to work with PDL 2.095

# This script is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# A copy of the GNU General Public License is available at <http://www.gnu.org/licenses/>.

use strict;
use warnings;
use feature qw( state say );

use Hash::Merge 'merge';
use PDL;
use PDL::Constants 'PI';
use PDL::Core 'topdl';
use PDL::DSP::Windows 'window';
use PDL::Graphics::Gnuplot;
use PDL::Stats::TS;

# Initial variables

use Getopt::Long;

GetOptions(
    'periods=i' => \my $periods_per_frame,
    'rate=i'    => \my $sampling_rate,
    'f0=i'      => \my $f0,
    'output=s'  => \my $output,
);

die 'Only PNG and SVG are supported'
    if $output && $output !~ /^(?:svg|png)$/;

$f0                //= 140;
$sampling_rate     //= 44100;
$periods_per_frame //= 3;

my $samples = ( 1 / $f0 ) * $sampling_rate * $periods_per_frame;
my $x = sequence $samples;

## The working sound

# A complex sine wave with a component at the desired target frequency
my $wave = 1 + 0.3 * sin( 2 * PI * $f0 * $x / $sampling_rate );

# with a loud component an octave higher
$wave *= sin( 2 * PI * $f0 * 2 * $x / $sampling_rate );

# Normalise the wave to a range of -1 .. 1
$wave /= max $wave;

draw(
    $wave,
    title => 'The sound in the analysis window',
    yrange => [ -1, 1 ],
    ytics => {
        locations => [1],
    },
);

## The Hanning window filter

my $filter = window $samples, 'hann';

draw(
    $filter,
    title => 'The Hanning filter function',
    yrange => [0, 1],
    ytics => {
        locations => [1],
    },
);

# The filtered sound
my $filtered = $wave * $filter;

{
    my ( $min, $max ) = $filtered->minmax;

    draw(
        $filtered,
        title => 'The filtered window',
        yrange => [ $min, $max ],
        ytics => {
            labels => [
                [ sprintf( '%.2f', $min ), $min, 0 ],
                [ 0, 0, 0 ],
                [ sprintf( '%.2f', 0.860384712853562 ), 0.860384712853562, 0 ],
            ],
        },
    );
}

# The autocorrelation of the filtered sound

my $filtered_acf = $filtered->acf;
my $real_peak  = ( 1 /       $f0   ) * $sampling_rate;
my $false_peak = ( 1 / ( 2 * $f0 ) ) * $sampling_rate;

draw(
    $filtered_acf,
    ylabel => 'ACF',
    xlabel => 'Time lag (in samples)',
    yrange => [-1,1],
    title => 'Normalized autocorrelation of the filtered sound',
    # FIXME: vertical markers not working. Why?
    # https://github.com/PDLPorters/PDL-Graphics-Gnuplot/issues/106
    # arrow => [
    #     [
    #         from => [ $false_peak, 'graph(0)' ],
    #         to   => [ $false_peak, 'graph(1)' ],
    #         'nohead',
    #     ],
    #     [
    #         from => [ $real_peak, 'graph(0)' ],
    #         to   => [ $real_peak, 'graph(1)' ],
    #         'nohead',
    #     ]
    # ],
);

# The autocorrelation of the filter

my $filter_acf
    = ( 1 - ( abs($x) / $samples ) )
    * ( 2 / 3 + 1 / 3 * cos( 2 * PI * $x / $samples ) )
    + ( 1 / ( 2 * PI ) )
    * sin( ( 2 * PI * abs($x) ) / $samples );

draw(
    $filter_acf,
    ylabel => 'ACF',
    xlabel => 'Time lag (in samples)',
    yrange => [ 0, 1 ],
    ytics => {
        locations => [1],
    },
    title => 'Normalized autocorrelation of the window function',
);

## The estimates of the original signal's autocorrelation

my $estimated_acf = $filtered_acf / $filter_acf;

# Discard second half
$estimated_acf->slice( int( $samples / 2 ) . ':' ) .= nan;

# Normalise
$estimated_acf /= max $estimated_acf;

draw(
    $estimated_acf,
    ylabel => 'ACF',
    xlabel => 'Time lag (in samples)',
    yrange => [ -1, 1 ],
    title => 'Estimated autocorrelation of the original signal',
    # FIXME: vertical markers not working. Why?
    # See https://github.com/PDLPorters/PDL-Graphics-Gnuplot/issues/106
    # arrow => [
    #     [
    #         from => [ $real_peak, 'graph(0,0)' ],
    #         to   => [ $real_peak, 'graph(1,1)' ],
    #         'nohead',
    #     ],
    # ],
);

# Calculating the f0 from the time lag in samples

{
    my $max = int $samples / 2;
    my $slice = "21:$max";
    my ($index) = @{ ( 20 + $estimated_acf->slice($slice)->maximum_ind )->unpdl };
    my $foo = $index / $sampling_rate;
    my $result = 1 / ( $index / $sampling_rate );
    say "f0 = $result";
}

sub draw {
    state $counter = 1;

    my $data = topdl(shift);
    my %args = @_;
    my ($samples) = $data->dims;

    my $w = gpwin;
    if ( $output ) {
        my %options = (
            output => "figure-$counter.$output",
            # FIXME: Why the special PNG cases?
            size => [ 1400, 800, $output eq 'png' ? 'px' : () ],
            font => $output eq 'png' ? ',18' : ',22',
        );

        $w->output( $output => %options );
    }

    # If we are generating images, don't render titles
    delete $args{title} if $output;

    $w->plot(
        merge(
            \%args,
            {
                ylabel => 'Intensity',
                xlabel => 'Samples',
                border => 0,
                xrange => [ 0, $samples ],
                xtics => {
                    scale => 0,
                    locations => [200],
                    labels => [
                        [ 0, 0, 0 ],
                        [ $samples, $samples, 0 ],
                    ],
                },
                ytics => {
                    scale => 0,
                },
            },
        ),
        with => 'lines',
        linewidth => 2,
        lc => 'rgb black',
        $data,
    );

    $counter++;
    $w->pause_until_close unless $output;
}

__END__

# The original version of this file resides at
# https://pdl.perl.org/advent/blog/2024/12/15/pitch-detection/pitch-detection.pl
#
# Source of the examples:
# Boersma, P. (1993) Accurate short-term analysis of the fundamental
# frequency and the harmonics-to-noise ratio of a sampled sound.
# IFA Proceedings 17: 97-110
# http://www.fon.hum.uva.nl/paul/papers/Proceedings_1993.pdf
