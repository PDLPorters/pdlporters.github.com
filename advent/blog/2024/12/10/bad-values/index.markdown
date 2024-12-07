title: Day 10: Playing Nice with Bad Values
disable_content_template: 1
tags:
    - 'Bad Values'
    - statistics
    - NaN
author: Boyd Duffee
images:
  banner:
    src: './banner.png'
    alt: 'The Grinch'
    data:
      attribution: |-
        <a href="https://www.flickr.com/photos/86665756@N00/8139519263">The Grinch's Holiday Workshop</a>" by <a href="https://www.flickr.com/photos/86665756@N00">Studio Sarah Lou</a> is licensed under <a href="https://creativecommons.org/licenses/by/2.0/?ref=openverse">CC BY 2.0</a>
data:
  bio: duffee
  description: handling bad values in data
---

Santa has discovered quality control issues in some of the scientific equipment that was delivered to children last Christmas.
The results from the Early Elf Joint Internship Training program were more No-No-No than Ho-Ho-Ho!
However the EEJIT's were consistent and testing revealed that the first 3 values in every 10 measurments were faulty. 
An update was sent to all affected children so they could recalculate their results, knowing which readings to ignore.

**Problem:** How should they treat the suspect values?
---

You could choose to set those values to some out of range number to flag them, could be 0 or -999 for temperatures - anything obviously unreal.
Children familiar with the POSIX standard might thing that the NaN (for Not a Number) is a better flag,
but the nicest children with the best behaviour (using PDL, of course) can set the `BAD` flag.

What will happen to each group?

    $x    = sequence(10);
    $zero = sequence(10);
    $nan  = sequence(10);
    $bad  = sequence(10);

    $zero->slice('0:2') .= 0;     # [0 0 0 3 4 5 6 7 8 9]
    $nan->slice('0:2')  .= nan;   # [NaN NaN NaN 3 4 5 6 7 8 9]
    $bad = $bad->setbadif($x < 3);# [BAD BAD BAD 3 4 5 6 7 8 9]

    pdl> p $x->avg, $x->median
    4.5     4.5
    pdl> p $zero->avg, $zero->median
    4.2     4.5
    pdl> p $nan->avg, $nan->median
    NaN     6.5
    pdl> p $bad->avg, $bad->median
    6       6

So, we've created 4 ndarrays and replaced the first three elements with either zeroes, NaN or BAD
to compare what happens when we compute some basic statistics, the mean and the median, for each.

The mean and median of the sequence 0 .. 9 are both 4.5.\
The mean and median of the sequence 3 .. 9 are now both 6.

We see that just changing values messes with the mean, but hasn't changed the median in this specific case because the order happens to remain the same.
It looks like NaN is treated as an infinity, because Infinity divided by 10 is still Infinity.
The median with NaN is interesting because using a `sort` to find the middle value would have shifted those values to one end or the other making the median 7.5 if there were three Infinities.
A median of 6.5 could be that the 3 flagged values are folded into one or NaN breaks `sort` in an interesting way.
So we see that routines that are aware of Bad values will give us the correct answers.

Now how do those values propagate through your calculations?
Operating on anything BAD makes the result BAD too, meaning coal in your stocking on Christmas morning.

    pdl> p $x + $bad
    [BAD BAD BAD 6 8 10 12 14 16 18]

    pdl> p $x / $x
    [NaN 1 1 1 1 1 1 1 1 1]

    pdl> p $x / $bad
    [BAD BAD BAD 1 1 1 1 1 1 1]

From the first example, adding two ndarrays together carries the BAD values through to the result.
The second example shows an ndarray divided by itself, resulting in ones except where 0 divides 0, giving NaN.
The third example shows that dividing by BAD is still BAD.

If you know the bad values are on the same elements, you can create a mask and apply it to every data array you need.
[PDL::Bad](https://metacpan.org/pod/PDL::Bad) also lets you swap NaN or a set value for Bad and back again.
You can read more about the reasoning behind it in [PDL::BadValues](https://metacpan.org/dist/PDL/view/Basic/Pod/BadValues.pod).

Remember: Be GOOD because Santa knows who's [naughty](https://metacpan.org/pod/PDL::Bad#isbad) or [nice](https://metacpan.org/pod/PDL::Bad#isgood)!
