---
title: Day 7: Plotting PDL data in the browser using Javascript
tags:
    - finance
    - plotting
author: Vikas N Kumar
images:
    banner:
        src: './banner.jpg'
        alt: 'Finance Chart showing Plotting on Browser with PDL'
data:
    bio: vikasnkumar
    description: Plotting PDL data in the browser using Javascript
---

## Introduction

In a [previous post](../../06/finance/) we
saw how to create a trading strategy using
[PDL::Finance::TA](https://metacpan.org/pod/PDL::Finance::TA) and
[PDL](https://metacpan.org/pod/PDL) with Perl.

You may have noticed that I used
[PDL::Graphics::Gnuplot](https://metacpan.org/pod/PDL::Graphics::Gnuplot) to do
the plotting there.  This module requires the user to install Gnuplot on their
desktop or server, which may be a limitation in some use cases.
---

Let us assume you were creating a webservice where you were running some back-end
PDL code, you may want to use a Javascript based plotting function.  Maybe you
want to use your favorite Javascript plotting library to do the plots.  Maybe
you want to do some live plotting based on some user interactions.

If this is your use case, this blog post will describe how to accomplish that.
We continue to use the same example as in the [previous blog
post](../../06/finance/)
related to creating buy and sell trading signals for a trading strategy. But I
will show you how to modify the plotting code to generate custom Javascript.

## Pre-requisites

We have some additional pre-requisites to accomplish this task, so consolidating all of them into one set of commands as below.

This is for Ubuntu or Debian based Linux. It will be similar for other Unixes or Windows.

    ## you need Perl installed and Gnuplot installed.
    $ sudo apt -y install gnuplot perl perl-modules cpanminus liblocal-lib-perl
    ## set your local Perl install to $HOME/perl5
    $ mkdir -p ~/perl5/lib/perl5
    ### add this oneliner to the ~/.bashrc or ~/.profile for your terminal
    $ eval $(perl -I ~/perl5/lib/perl5 -Mlocal::lib)
    $ cpanm PDL PDL::Graphics::Gnuplot PDL::Finance::TA JSON::XS \
        LWP::UserAgent DateTime Path::Tiny Template::Toolkit Browser::Open
    ## sometimes this module does not pass the tests
    $ cpanm -f Finance::QuoteHist
    ## check if PDL got installed
    $ which perldl

## What are we really doing ?

The premise of the plotting library is quite simple. We will create a
**template** file with the HTML required to plot the chart, and auto-generate
some JSON data from the PDL objects into the template file using the
[Template::Toolkit](https://metacpan.org/pod/Template::Toolkit) module, process
the template and generate a local HTML file, and then use the
[Browser::Open](https://metacpan.org/pod/Browser::Open) module to open the
locally created HTML file using the `file://` scheme.

### HighCharts

[HighCharts](https://www.highcharts.com/) is a very popular open-source and
commercial Javascript plotting library used in the finance industry, and also in
various other industries.

Their library is easy to use and has a ton of documentation. If you prefer
something else like [ZingCharts](https://www.zingchart.com/) or
[ChartJS](https://www.chartjs.org/) the concepts described here continue to
apply.

All you will do in that case is rewrite the template file with the correct
Javascript implementation for that library.

For purposes of this blog post, HighCharts will be used.

## HighCharts Objects in Perl

We now create custom Perl objects that will then be converted to JSON and
processed with the template.

HighCharts plots financial time series data, where the timestamp is in
milliseconds.

We will be referencing the code from the [previous post](../../06/finance/)
here.

### Create the Open-High-Low-Close chart object

It is actually really easy to convert PDL to JSON for HighCharts.

We create a PDL object with the timestamp, open price, high price, low price and
close price in that order. We then `transpose` the PDL since the PDL is stored
column-wise and we need to convert it to row-wise. Then we call the magical
`unpdl` function which converts the PDL object into a Perl array of arrays, and
then we invoke `encode_json` from the `JSON::XS` module to convert it to JSON.

After that we create a HASH object that will be passed as a configuration option
in the template (shown in the next section), with information such as `data`
which points to the generated JSON. Note the `type` of the chart here is
`candlestick`. If you want to just plot the close price, you would create a PDL
with the timestamp and the close price, and set the `type` of the chart to
`line`.

The code for this is shown below. We chose not to clean any `bad` values for PDL
since the price data is assumed clean and it actually is.

    ## plot the data using Javascript in a Browser
    ## we have to create multiple objects
    my @charts = ();
    ## convert the PDL to javascript and write to a file
    ## HighCharts requires timestamp in milliseconds
    ## each object should have the 5 dimensions: timestamp_ms, open, high, low, close - hence we transpose the PDL
    my $px_pdl_js = encode_json pdl($timestamp * 1000, $open_px, $high_px, $low_px, $close_px)->transpose->unpdl;
    push @charts, {
        title => $symbol,
        data => $px_pdl_js,
        type => 'candlestick',
        id => lc "candlestick-$symbol",
        y_axis => 0,
    };

### Create the Bollinger Bands objects

Once you have generated the Bollinger Band indicator PDLs, we have to convert
them to JSON too. However, the Bollinger Bands are lagging indicators which
means that some data points will be blank or marked as `bad` by
`PDL::Finance::TA`.  We need to remove those bad values completely from the JSON
and that is done as below.

First we create a PDL with 2 dimensions: timestamp in milliseconds and the
upper (or middle or lower) Bollinger band PDL. We then transpose it to get it in
row-major form.

Then we collect indices of the resulting PDL, `$bb_upper_2` in the below code,
where the 2<sup>nd</sup> dimension values are not zero and not bad using the `which` function.

We then create a new PDL `$bb_upper_clean` that will use the `dice_axis` call
and remove all the entries that do not exist in the `$bbu_idx` indices list.

This new variable `$bb_upper_clean` is now our clean PDL and we call `unpdl` on
it to convert it to a Perl array of arrays, and then encode it to JSON using
`encode_json` from `JSON::XS`.

We repeat this process for the lower and middle Bollinger band PDLs.

Lastly, we create chart objects with these cleaned PDL-to-JSON encoded values in
the `data` field and the `type` fields are set to `line`.

    ## add the indicator chart. Bollinger Bands are on the same axis as the price, so y_axis is 0
    ## we need to remove the BAD values completely from the new PDL
    my $bb_upper_2 = pdl($timestamp * 1000, $bb_upper)->transpose;
    my $bbu_idx = $bb_upper_2((1))->which;
    my $bb_upper_clean = $bb_upper_2->dice_axis(1, $bbu_idx);
    my $bb_upper_js = encode_json $bb_upper_clean->unpdl;

    my $bb_middle_2 = pdl($timestamp * 1000, $bb_middle)->transpose;
    my $bbm_idx = $bb_middle_2((1))->which;
    my $bb_middle_clean = $bb_middle_2->dice_axis(1, $bbm_idx);
    my $bb_middle_js = encode_json $bb_middle_clean->unpdl;

    my $bb_lower_2 = pdl($timestamp * 1000, $bb_lower)->transpose;
    my $bbl_idx = $bb_lower_2((1))->which;
    my $bb_lower_clean = $bb_lower_2->dice_axis(1, $bbl_idx);
    my $bb_lower_js = encode_json $bb_lower_clean->unpdl;

    push @charts, {
        title => 'Bollinger Band - Upper',
        type => 'line',
        data => $bb_upper_js,
        id => lc "bb-upper-$symbol",
    }, {
        title => 'Bollinger Band - Middle',
        type => 'line',
        data => $bb_middle_js,
        id => lc "bb-middle-$symbol",
    }, {
        title => 'Bollinger Band - Lower',
        type => 'line',
        data => $bb_lower_js,
        id => lc "bb-lower-$symbol",
    };

### Create the Buy and Sell signal objects

Similarly, we clean the buy and sell signal PDL objects and encode them to JSON.

What's different here is that the `marker_symbol` chosen is `triangle` (upward
triangle), and the `marker_color` chosen is `green` for the buy signal.
Likewise, the marker color for the sell signal is `red` and the marker symbol is
`triangle-down` (downward triangle). These are marker types specified in the
Highcharts documentation.

The `type` is still `line`. What this combination does is generate a line chart
connecting the buy signals and the sell signals but draws extra markers on them
to show the buy and sell trades.

In the template (shown in the next section), we actually set the line-width to 0
so that the unnecessary line is not drawn. We do that by using the `is_signal`
flag which the template will process.

    ## for buys and sells we just want to avoid empty data
    my $buys_2 = pdl($timestamp * 1000, $buys)->transpose;
    my $bidx = $buys_2((1))->which;## check if !0 is true
    my $clean_buys = $buys_2->dice_axis(1, $bidx);
    my $buys_js = encode_json $clean_buys->unpdl;
    push @charts, {
        title => 'Buy Signals',
        data => $buys_js,
        y_axis => 0,
        type => 'line',
        marker_symbol => 'triangle',
        marker_color => 'green',
        is_signal => 1,
    };

    my $sells_2 = pdl($timestamp * 1000, $sells)->transpose;
    my $sidx = $sells_2((1))->which;## check if !0 is true
    my $clean_sells = $sells_2->dice_axis(1, $sidx);
    my $sells_js = encode_json $clean_sells->unpdl;
    push @charts, {
        title => 'Sell Signals',
        data => $sells_js,
        y_axis => 0,
        type => 'line',
        marker_symbol => 'triangle-down',
        marker_color => 'red',
        is_signal => 1,
    };

## The Template Creation

As per the documentation provided by the [Template
Toolkit](https://metacpan.org/pod/Template::Toolkit) developers, we create an
HTML file, and save it in the `__DATA__` section of our script.

You may also save it as a file with `.tt` extension and have the template
processor read the file as opposed to a string. For purposes of this blog post,
we will store the content in the `__DATA__` section of our script.

A sample template that works is provided below. As you can see, the `<body>` tag
does not contain anything except for a `<div>` container where we will plot the
chart.

The title of the page is referenced by a variable `page.title`. Since we are
plotting financial data, we will reference the
[HighStock](https://www.highcharts.com/products/stock/) product from HighCharts.

If you are **not** plotting  financial data, you may be able to just use the
HighCharts base product.

Looking at the `<script>` block where we generate a chart based on some inputs,
we can see that there is mainly a single call to the HighCharts library.

The variable `chart.charts` has an array of chart objects that will add multiple
plots to the same chart.

The variable `chart.title` defines the chart title.

Each chart object, has a `type` which could be lines, points, candlesticks etc.
as supported by the HighCharts library.  The `data` object is what we will be
transmitting from the Perl code that has the PDL objects and converting it into
JSON for the Javascript code to accept.

Note the `is_signal` conditional block, which adds additional options for the
buy and sell signals to be rendered on the plot. In the previous section, we saw
that we were setting the `is_signal` to 1 for those chart objects.

The rest of the options are based on what HighCharts library requires, and we
recommend referring to their documentation.

**NOTE**: HighCharts does not accept PDL `bad` values, which get transmitted as
strings, so we ended up doing some additional cleanup in the Perl code to handle
this (as shown in the sections above).

    <!DOCTYPE HTML>
    <html lang="en">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="copyright" content="App::financeta Authors">
        <meta name="author" content="Vikas N Kumar <vikas@cpan.org>">
        <meta name="description" content="App::financeta">
        <link rel="icon" href="chart-line-solid.png" type="image/png">
        <title>[% page.title %]</title>
        <script src="https://code.highcharts.com/stock/highstock.js"></script>
        <style>
        #chart-container {
            min-width: 600px;
            min-height: 400px;
            height: [% chart.height %];
            width: 95%;
            margin: 20px;
        };
        </style>
        </head>
        <body>
            <h1>[% page.title %]</h1>
            <hr/>
            <div id="chart-container">
            </div>
            <hr/>
        <script type="text/javascript">
            [% IF chart %]
            window.chart = new Highcharts.stockChart('chart-container', {
                accessibility: { enabled: false },
                yAxis: [{
                        labels: { align: 'left' },
                        height: "400px",
                        resize: { enabled: true },
                }],
                title: { text: "[% chart.title %]" },
                series:[
                [% FOREACH el IN chart.charts %]
                    {
                        type: "[% el.type %]",
                        name: "[% el.title %]",
                        id: "[% el.id %]",
                        data: [% el.data %],
                        [% IF el.y_axis %]
                        yAxis: [% el.y_axis %],
                        [% END %]
                        [% IF el.is_signal %]
                        lineWidth: 0,
                        showInLegend: true,
                        marker: {
                            enabled: true,
                            fillColor: "[% el.marker_color %]",
                            radius: 4,
                            symbol: "[% el.marker_symbol %]",
                        },
                        [% END %]
                        [% IF el.type == 'area' %]
                        color: 'green',
                        negativeColor: 'red',
                        threshold: 0,
                        marker: { enabled: true },
                        [% END %]
                    },
                [% END %]
                ],
                responsive: {
                    rules: [{
                        condition: { maxWidth: 800 },
                        chartOptions: {
                            rangeSelector: {
                                inputEnabled: false
                            }
                        }
                    }]
                }
            });
            [% END %]
        </script>
        </body>
    </html>

## Processing the Template

To process the template we will load the contents of the template from the
`__DATA__` section and then process it in-place in the script. To do that you
create an object for the `Template` module and then call the `process` function
with the first argument being the template content, the second argument being
the variables that the template will process such as `chart` and `page` in our
case, and the third option will be the HTML file name to be generated.

We have the `@charts` variable as generated in the previous section for plotting
the HighCharts chart data. The `$ttconf` variable is a HASH object that holds all
the variables that the template needs.

We have `$symbol` which is the symbol of the prices we have downloaded as per
the [previous post](../../06/finance/).
In our case it is the string `DOGEUSD`.

We then load the `__DATA__` contents into `$ttcontent`. We also save that to a
file named `pdlchart.tt`.
We create a path for `pdlchart.html` using the `Path::Tiny` module and use that
in the `process()` call.

We then invoke the `process()` function with the `pdlchart.tt` full path  as the
first argument, the `$ttconf` as the second argument and the `$htmlfile` string.

If the processing succeeds, we then open the created HTML file in the browser
using the `Browser::Open` module.

Below is the code for this.

    ## create variables to pass to the template
    my $ttconf = {
        page => { title => "Plot $symbol with HighCharts" },
        chart => { height => "600px", charts => \@charts, title => $symbol },
    };
    ## load a pre-designed Template file 
    my $ttcontent = do { local $/ = undef; <DATA> };
    ## dump it as a template file for the browser to load it
    my $ttfile = path('pdlchart.tt')->realpath;
    path($ttfile)->spew($ttcontent) unless -e $ttfile;
    print "TTFile: $ttfile\n";
    my $htmlfile = path('pdlchart.html')->realpath;
    print "HTMLFile: $htmlfile\n";

    my $tt = Template->new({ ABSOLUTE => 1 });
    my $ret = $tt->process("$ttfile", $ttconf, "$htmlfile", { binmode => ':utf8' });
    if ($ret) {
        my $url = "file://$htmlfile";
        print "opening $url\n";
        my $ok = Browser::Open::open_browser($url, 1);
        if (not defined $ok or $ok != 0) {
            die "Failed to open $url in a browser. Return value: $ok";
        } else {
            print "Successfully opened $url in browser\n";
        }
    } else {
        die "Error processing template $ttfile: " . $tt->error() . "\n";
    }

## Plot Screenshot

Below is a screenshot of the full script that you would see in the browser,
along with the Bollinger Bands and the buy and sell signals.

![Plotting HighCharts with PDL - Screenshot](banner.jpg)


## The Full Script

We now reference most of the script from the [previous post](../../06/finance/) here, until the plotting section.

**NOTE**: We have removed the dependency of this script on `PDL::Finance::Gnuplot` and instead added `Template` and `Browser::Open` as imported modules.

    #!/usr/bin/env perl
    use strict;
    use warnings;
    use PDL;
    use PDL::NiceSlice;
    use PDL::Finance::TA;
    use JSON::XS qw(decode_json encode_json);
    use LWP::UserAgent;
    use DateTime;
    use Try::Tiny;
    use Path::Tiny;
    use Template;
    use Browser::Open;

    sub get_data($) {
        my $symbol = shift;
        my $filename = lc "$symbol.json";
        my $content;
        my $qdata;
        my $url = sprintf("https://api.gemini.com/v2/candles/%s/%s", lc $symbol, '1day');
        if (-e $filename) {
            print "Found $filename, loading data from that\n";
            $content = path($filename)->slurp;
        } else {
            my $lwp = LWP::UserAgent->new(timeout => 60);
            $lwp->env_proxy;
            my $resp = $lwp->get($url);
            if ($resp->is_success) {
                $content = $resp->decoded_content;
                path($filename)->spew($content);
            } else {
                warn "Error from request to $url: " . $resp->status_line;
                return undef;
            }
        }
        if (defined $content and length($content)) {
            my $jquotes = decode_json $content;
            if (ref $jquotes eq 'ARRAY' and scalar(@$jquotes)) {
                ## sort quotes by timestamp
                my @sorted = sort { $a->[0] <=> $b->[0] } @$jquotes;
                foreach my $q (@sorted) {
                    ## timestamp is the first column in milliseconds
                    $q->[0] /= 1000;
                }
                ## convert the quotes to a PDL
                $qdata = pdl(@sorted)->transpose;
            } else {
                warn "No quotes returned by $url or $filename";
                $qdata = undef;
            }
        } else {
            warn "No content received from $url or $filename";
            $qdata = undef;
        }
        ## now we operate on the $qdata PDL object
        return $qdata;
    }

    my $symbol = $ARGV[0] // 'DOGEUSD';
    my $qdata = get_data($symbol);
    die "Unable to get data for $symbol" unless ref $qdata eq 'PDL';
    print $qdata;

    my $timestamp = $qdata(, (0));
    my $open_px = $qdata(, (1));
    my $high_px = $qdata(, (2));
    my $low_px = $qdata(, (3));
    my $close_px = $qdata(, (4));
    ## use the default values
    ## each of these are 1-D PDLs
    my ($bb_upper, $bb_middle, $bb_lower) = PDL::ta_bbands($close_px, 5, 2, 2, 0);
    my $buys            = zeroes( $close_px->dims );
    my $sells           = zeroes( $close_px->dims );
    ## use a 1 tick lookback
    my $lookback        = 1;
    ## calculate the indexes of the lookback PDL based on LOW price
    my $idx_0           = xvals( $low_px->dims ) - $lookback;
    ## if the lookback index is negative set it to 0
    $idx_0 = $idx_0->setbadif( $idx_0 < 0 )->setbadtoval(0);
    ## get the indexes of when the LOW Price < Lower Bollinger Band based on the lookback
    my $idx_1 = which( 
            ($low_px->index($idx_0) > $bb_lower->index($idx_0)) &
            ($low_px < $bb_lower)
    );
    ## set the buys to be on the OPEN price for those indexes
    $buys->index($idx_1) .= $open_px->index($idx_1);
    ## set all 0 values to BAD to avoid plotting zeroes
    $buys->inplace->setvaltobad(0);

    ## calculate the indexes of the lookback PDL based on HIGH price
    my $idx_2 = xvals( $high_px->dims ) - $lookback;
    ## if the lookback index is negative set it to 0
    $idx_2 = $idx_2->setbadif( $idx_2 < 0 )->setbadtoval(0);
    ## get the indexes of when the HIGH Price > Upper Bollinger Band based on the lookback
    my $idx_3 = which(
        ($high_px->index($idx_2) < $bb_upper->index($idx_2)) &
        ($high_px > $bb_upper )
    );
    ## set the sells to be on the CLOSE price for those indexes
    $sells->index($idx_3) .= $close_px->index($idx_3);
    ## set all 0 values to BAD to avoid plotting zeroes
    $sells->inplace->setvaltobad(0);

    ## plot the data using Javascript in a Browser
    ## we have to create multiple objects
    my @charts = ();
    ## convert the PDL to javascript and write to a file
    ## HighCharts requires timestamp in milliseconds
    ## each object should have the 5 dimensions: timestamp_ms, open, high, low, close - hence we transpose the PDL
    my $px_pdl_js = encode_json pdl($timestamp * 1000, $open_px, $high_px, $low_px, $close_px)->transpose->unpdl;
    push @charts, {
        title => $symbol,
        data => $px_pdl_js,
        type => 'candlestick',
        id => lc "candlestick-$symbol",
        y_axis => 0,
    };
    ## add the indicator chart. Bollinger Bands are on the same axis as the price, so y_axis is 0
    ## we need to remove the BAD values completely from the new PDL
    my $bb_upper_2 = pdl($timestamp * 1000, $bb_upper)->transpose;
    my $bbu_idx = $bb_upper_2((1))->which;
    my $bb_upper_clean = $bb_upper_2->dice_axis(1, $bbu_idx);
    my $bb_upper_js = encode_json $bb_upper_clean->unpdl;

    my $bb_middle_2 = pdl($timestamp * 1000, $bb_middle)->transpose;
    my $bbm_idx = $bb_middle_2((1))->which;
    my $bb_middle_clean = $bb_middle_2->dice_axis(1, $bbm_idx);
    my $bb_middle_js = encode_json $bb_middle_clean->unpdl;

    my $bb_lower_2 = pdl($timestamp * 1000, $bb_lower)->transpose;
    my $bbl_idx = $bb_lower_2((1))->which;
    my $bb_lower_clean = $bb_lower_2->dice_axis(1, $bbl_idx);
    my $bb_lower_js = encode_json $bb_lower_clean->unpdl;

    push @charts, {
        title => 'Bollinger Band - Upper',
        type => 'line',
        data => $bb_upper_js,
        id => lc "bb-upper-$symbol",
    }, {
        title => 'Bollinger Band - Middle',
        type => 'line',
        data => $bb_middle_js,
        id => lc "bb-middle-$symbol",
    }, {
        title => 'Bollinger Band - Lower',
        type => 'line',
        data => $bb_lower_js,
        id => lc "bb-lower-$symbol",
    };

    ## for buys and sells we just want to avoid empty data
    my $buys_2 = pdl($timestamp * 1000, $buys)->transpose;
    my $bidx = $buys_2((1))->which;## check if !0 is true
    my $clean_buys = $buys_2->dice_axis(1, $bidx);
    my $buys_js = encode_json $clean_buys->unpdl;
    push @charts, {
        title => 'Buy Signals',
        data => $buys_js,
        y_axis => 0,
        type => 'line',
        marker_symbol => 'triangle',
        marker_color => 'green',
        is_signal => 1,
    };

    my $sells_2 = pdl($timestamp * 1000, $sells)->transpose;
    my $sidx = $sells_2((1))->which;## check if !0 is true
    my $clean_sells = $sells_2->dice_axis(1, $sidx);
    my $sells_js = encode_json $clean_sells->unpdl;
    push @charts, {
        title => 'Sell Signals',
        data => $sells_js,
        y_axis => 0,
        type => 'line',
        marker_symbol => 'triangle-down',
        marker_color => 'red',
        is_signal => 1,
    };
    ## create variables to pass to the template
    my $ttconf = {
        page => { title => "Plot $symbol with HighCharts" },
        chart => { height => "600px", charts => \@charts, title => $symbol },
    };
    ## load a pre-designed Template file 
    my $ttcontent = do { local $/ = undef; <DATA> };
    ## dump it as a template file for the browser to load it
    my $ttfile = path('pdlchart.tt')->realpath;
    path($ttfile)->spew($ttcontent) unless -e $ttfile;
    print "TTFile: $ttfile\n";
    my $htmlfile = path('pdlchart.html')->realpath;
    print "HTMLFile: $htmlfile\n";

    my $tt = Template->new({ ABSOLUTE => 1 });
    my $ret = $tt->process("$ttfile", $ttconf, "$htmlfile", { binmode => ':utf8' });
    if ($ret) {
        my $url = "file://$htmlfile";
        print "opening $url\n";
        my $ok = Browser::Open::open_browser($url, 1);
        if (not defined $ok or $ok != 0) {
            die "Failed to open $url in a browser. Return value: $ok";
        } else {
            print "Successfully opened $url in browser\n";
        }
    } else {
        die "Error processing template $ttfile: " . $tt->error() . "\n";
    }

    __DATA__
    <!DOCTYPE HTML>
    <html lang="en">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="copyright" content="App::financeta Authors">
        <meta name="author" content="Vikas N Kumar <vikas@cpan.org>">
        <meta name="description" content="App::financeta">
        <link rel="icon" href="chart-line-solid.png" type="image/png">
        <title>[% page.title %]</title>
        <script src="https://code.highcharts.com/stock/highstock.js"></script>
        <style>
        #chart-container {
            min-width: 600px;
            min-height: 400px;
            height: [% chart.height %];
            width: 95%;
            margin: 20px;
        };
        </style>
        </head>
        <body>
            <h1>[% page.title %]</h1>
            <hr/>
            <div id="chart-container">
            </div>
            <hr/>
        <script type="text/javascript">
            [% IF chart %]
            window.chart = new Highcharts.stockChart('chart-container', {
                accessibility: { enabled: false },
                yAxis: [{
                        labels: { align: 'left' },
                        height: "400px",
                        resize: { enabled: true },
                }],
                title: { text: "[% chart.title %]" },
                series:[
                [% FOREACH el IN chart.charts %]
                    {
                        type: "[% el.type %]",
                        name: "[% el.title %]",
                        id: "[% el.id %]",
                        data: [% el.data %],
                        [% IF el.y_axis %]
                        yAxis: [% el.y_axis %],
                        [% END %]
                        [% IF el.is_signal %]
                        lineWidth: 0,
                        showInLegend: true,
                        marker: {
                            enabled: true,
                            fillColor: "[% el.marker_color %]",
                            radius: 4,
                            symbol: "[% el.marker_symbol %]",
                        },
                        [% END %]
                        [% IF el.type == 'area' %]
                        color: 'green',
                        negativeColor: 'red',
                        threshold: 0,
                        marker: { enabled: true },
                        [% END %]
                    },
                [% END %]
                ],
                responsive: {
                    rules: [{
                        condition: { maxWidth: 800 },
                        chartOptions: {
                            rangeSelector: {
                                inputEnabled: false
                            }
                        }
                    }]
                }
            });
            [% END %]
        </script>
        </body>
    </html>
