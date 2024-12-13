---
title: Day 14: Getting started with Statistics
disable_content_template: 1
tags:
    - statistics
    - correlation
    - significance
author: Boyd Duffee
images:
  banner:
    src: 'banner.svg'
    alt: 'Histogram of sepal widths for Iris versicolor'
    data:
      attribution: |-
        By <a href="https://en.wikipedia.org/wiki/User:Qwfp">en:User:Qwfp</a> (original); <a href="//commons.wikimedia.org/wiki/User:Pbroks13" title="User:Pbroks13">Pbroks13</a> (redraw) - <a href="https://en.wikipedia.org/wiki/Image:Fisher_iris_versicolor_sepalwidth.png">Fisher iris versicolor sepalwidth.png</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" title="Creative Commons Attribution-Share Alike 3.0">CC BY-SA 3.0</a>, <a href="https://commons.wikimedia.org/w/index.php?curid=4369908">Link</a>
data:
  bio: duffee
  description: Basic statistical functions in PDL
---

If you're doing statistics on vast swathes of data, you could use [PDL](https://metacpan.org/pod/PDL::Stats)!

Santa's Naughty and Nice list has over a billion names and the Elf Data Analytics section of the workshop produces
a display of trends for the January retrospective.
If there is an increase in naughtiness, is it because nice children are starting to forget their manners
or are naughty children using rude words, taking up smoking and creating merge conflicts?

You would think this discussion goes on using the social media tailor-made for cold weather climates ... [Mastodon](https://mathstodon.xyz/about)!
---

## The Basics
PDL gives you basic statistics out of the box
<img align="right" width="100" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Visualisation_mode_median_mean.svg/140px-Visualisation_mode_median_mean.svg.png">

Yes, you'll want the mean
or the [average](https://metacpan.org/pod/PDL::Ufunc#average) and
the [median](https://metacpan.org/pod/PDL::Ufunc#median) and ... yada, yada, yada.
Yes, there are a _lot_ of aliases available as well as _slightly_ different versions of a function so that you get exactly what you want. Assume that PDL has the lot. The fun is in trying to find just _where_ it is in the documentation.
Oh, Santa! For Christmas, I want a customizable cheat-sheet for stats functions with only the aliases that _I_ use
hyperlinked to the documentation! I've been a good little Elf!

Usually you want more than a single statistic. More useful are the functions that return a bunch of stats together.
[minmax](https://metacpan.org/pod/PDL::Ufunc#minmax) will give you both minimum and maximum values of the ndarray.
To get a measure of the distribution of your data, you want the
[stats](https://metacpan.org/pod/PDL::Primitive#stats) function which gives you the mean,
the [population RMS deviation](https://en.wikipedia.org/wiki/Root_mean_square_deviation)
the median, minimum, maximum,
[average absolute deviation](https://en.wikipedia.org/wiki/Average_absolute_deviation)
and the [RMS deviation](https://en.wikipedia.org/wiki/Standard_deviation#Corrected_sample_standard_deviation) or square root of the variance, all in one call.

![Standard deviation](https://upload.wikimedia.org/wikipedia/commons/8/8c/Standard_deviation_diagram.svg)

On the subject of the difference between the RMS deviation and the population RMS deviation,
according to the authors of [Numerical Recipes](https://numerical.recipes/),
if the difference between N and N-1 matters to you in your variance calculation, then you are up to **no good**.
(commentary on Equation 14.1.2)

### X-over
But what if you want to compare the rows of your ndarray to each other?
Do you have to split the data up or do fancy indexing tricks?

No - you want the various _over_ functions. For instance,
[medover](https://metacpan.org/pod/PDL::Ufunc#medover) takes median along the first dimension.
You've got [prodover](https://metacpan.org/pod/PDL::Ufunc#prodover) for products,
[sumover](https://metacpan.org/pod/PDL::Ufunc#sumover) for sums
... and 34 others in [PDL::Ufunc](https://metacpan.org/pod/PDL::Ufunc).
If the first dimension is not the one you're after, look to the [xchg](https://metacpan.org/pod/PDL::Slices#xchg) function to get the dimension you want.

Wait - which one is the first dimension again?
Let's see an example using **statsover** on a 5x3 ndarray and we'll get either 3 values or 5 values.
The averages across the rows are `[3 3 3]` and down the columns are `[1 2 3 4 5]`.

    pdl> $m = xvals(5, 3) + 1
    [
     [1 2 3 4 5]
     [1 2 3 4 5]
     [1 2 3 4 5]
    ]
    pdl> p statsover $m
    [3 3 3] [ 1.58 1.58 1.58] [3 3 3] ...
    
Right, so X-over works on the rows, then.  
But what if some data is better than others? We can give "weights" to values according to how much more significance they should have. Make an ndarray of ones and then zero the first two columns. That should change the average to `(3+4+5)/3 = 4`.

    pdl> $w = $m->ones->copy
    pdl> $w->where($m < 3) .= 0
    [
     [0 0 1 1 1]
     [0 0 1 1 1]
     [0 0 1 1 1]
    ]
    pdl> p stats $m, $w
    4 0.866 3 1 5 0.666 0.816
    pdl> p statsover $m, $w
    [4 4 4] [1 1 1] [3 3 3] [1 1 1]  ....

A lot of the statistical functions will take an ndarray of weights, the same size as the data of course.

## For more detailed statistics ... PDL::Stats
The above will give most people what they want, but sometimes you need more detail.
For that we can use the [PDL::Stats](https://metacpan.org/pod/PDL::Stats) module.
It also gives you both biased and unbiased versions of [variance](https://metacpan.org/pod/PDL::Stats::Basic#var)
and [standard deviation](https://metacpan.org/pod/PDL::Stats::Basic#stdv).
It adds in [skew](https://metacpan.org/pod/PDL::Stats::Basic#skew)
and [kurtosis](https://metacpan.org/pod/PDL::Stats::Basic#kurt),
showing you the [shape of the distribution](https://en.wikipedia.org/wiki/Shape_of_a_probability_distribution).
![Skewness](https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Relationship_between_mean_and_median_under_different_skewness.png/800px-Relationship_between_mean_and_median_under_different_skewness.png)

It calculates the [standard error](https://metacpan.org/pod/PDL::Stats::Basic#se) in your data,
the [sum of squared deviations from the mean](https://metacpan.org/pod/PDL::Stats::Basic#ss)
and [covariance](https://metacpan.org/pod/PDL::Stats::Basic#cov).

<img align="right" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Correlation_coefficient.png/320px-Correlation_coefficient.png">

Can it answer the questions today's children are concerned with, like,
does being _really good_ translate into even more presents?
For that you would need the [Pearson correlation coefficient](https://metacpan.org/pod/PDL::Stats::Basic#corr)
which measures the [linear correlation between 2 sets of data](https://en.wikipedia.org/wiki/Pearson_correlation_coefficient).

Are children from one country much nicer than another?

[Student's t test](https://metacpan.org/pod/PDL::Stats::Basic#t_test) tests whether the difference between two groups is [significant or not](https://en.wikipedia.org/wiki/Student%27s_t-test) against the null hypothesis.
It's not concrete proof of the answer, but will give you a measure of how confident Santa will be
in the elves' geographical allocation of oranges for stockings.

In the absence of a continuous measure of goodness,
the [binomial test](https://metacpan.org/pod/PDL::Stats::Basic#binomial_test) is a one-tailed significance test for two-outcome distribution that should be used for [categorical data](https://en.wikipedia.org/wiki/Binomial_test) such as Naughty and Nice.

That should give you enough pointers into the documentation to get you started on your Data Elf journey.
But before publishing your results on this generation of children, have a read through
[Statistics Done Wrong](https://www.statisticsdonewrong.com/) and make sure that you have enough data
so that your analysis [isn't underpowered](https://www.statisticsdonewrong.com/power.html).

Remember this season to be [significantly](https://www.statisticsdonewrong.com/significant-differences.html) nice!
