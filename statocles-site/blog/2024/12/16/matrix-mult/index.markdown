---
title: Day 16: These are Testing Times, Indeed!
disable_content_template: 1
tags:
    - Test
    - 'matrix operations'
    - 'complex numbers'
author: Boyd Duffee
images:
  banner:
    src: 'banner.jpg'
    alt: 'Matrix multiplication in symbols'
    data:
      attribution: |-
        <a href="https://commons.wikimedia.org/w/index.php?curid=113553734">Matrix multiplication</a>" by <a href="https://commons.wikimedia.org/w/index.php?title=User:Brigban&action=edit&redlink=1">Brigban</a> is marked with <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en/?ref=openverse">CC0 1.0 </a>
data:
  bio: duffee
  description: Using Test::PDL to explore matrix multiplication
---

If you're multiplying lots of matrices together, you need [PDL](https://metacpan.org/pod/PDL)!

There are bales of decorative paper [Markov chains](https://en.wikipedia.org/wiki/Markov_chain) that have gotten tangled,
so we're going to square things away by multiplying orthogonal matrices and checking the results with
[Tests](https://en.wikipedia.org/wiki/Test-driven_development).
---

Like a shiny package under this year's tree,
[Test::PDL](https://metacpan.org/pod/Test::PDL) arrived in PDL v2.094 which is newer than most Linux package managers provide.
You'll either need to wait for an update or to [install the latest version from CPAN](https://pdl.perl.org/?page=install).
(I found installing the new version fairly easy. Just a bit of a wait.)
But you can install Test::PDL from CPAN for use with an older PDL:

    cpanm Test::PDL@0.21

Find yourself an [orthogonal matrix](https://en.wikipedia.org/wiki/Orthogonal_matrix) like this one  
<img src="https://latex.codecogs.com/svg.latex?\left[\begin{array}{cc} \cos\theta &\sin\theta \\ -\sin\theta &\cos\theta \end{array}\right]" title="rotation matrix" />  
and choose an angle, say 30&deg; which makes cos 30&deg; = 0.866 and sin 30&deg; = 1/2.
Then construct the Identity matrix, with 1's on the diagonal and zeroes everywhere else.

By definition, an orthogonal matrix multiplied by its
[transpose](https://metacpan.org/pod/PDL::Basic#transpose) is the identity matrix.
Use the [is_pdl](https://metacpan.org/pod/Test::PDL#is_pdl) function to show this is true.

    use Test::PDL
    $m = pdl([0.866, 0.5],[-0.5, 0.866])
    [
     [0.866   0.5]
     [ -0.5 0.866]
    ]
    $id = identity(2)    # Identity matrix
    [
     [1 0]
     [0 1]
    ]

    is_pdl($m * $m->t, $id, 'Orthogonal matrix times its transpose is the Identity matrix')
    not ok 1
    #     4/4 values do not match
    #          got: Double   D [2,2]      (P    )
    # [
    #  [  0.749956      -0.25]
    #  [     -0.25   0.749956]
    # ]
    #
    #     expected: Double   D [2,2]      (P    )
    # [
    #  [1 0]
    #  [0 1]
    # ]
    #
    # First <=5 values differ at:
    # [
    #  [0 0]
    #  [1 0]
    #  [0 1]
    #  [1 1]
    # ]
    # Those 'got' values: [0.749956 -0.25 -0.25 0.749956]
    # Those 'expected' values: [1 0 0 1]

Wait, **what?**

That should be `ok`. Let's do some sanity checking with `transpose` and the `*` operator.
Those digits are messing with my brain. Let's get some easier numbers to work with.

    $n = sequence(2,2) + 1
    [
     [1 2]
     [3 4]
    ]
    p $n->t
    [
     [1 3]
     [2 4]
    ]
    p $n * $n
    [
     [ 1  4]
     [ 9 16]
    ]

Now I see what's going on.
The off-diagonal elements are swapped, so the transpose is correct. 
The last example is the square of each _index value_.
This means that the `*` operator gives us
**C<span style="vertical-align:sub">ij</span> = A<span style="vertical-align:sub">ij</span> * B<span style="vertical-align:sub">ij</span>**,
not the dot product of the **i**th row with the **j**th column.

I need the [x](https://metacpan.org/pod/PDL::Primitive#x) operator to do matrix multiplication like in my linear algebra textbook.

    is_pdl($m x $m->t, $id, 'Orthogonal matrix times its transpose is the Identity matrix')
    not ok 2
    #     2/4 values do not match
    #          got: Double   D [2,2]      (P    )
    # [
    #  [  0.999956          0]
    #  [         0   0.999956]
    # ]
    #
    #     expected: Double   D [2,2]      (P    )
    # [
    #  [1 0]
    #  [0 1]
    # ]
    #
    # First <=5 values differ at:
    # [
    #  [0 0]
    #  [1 1]
    # ]
    # Those 'got' values: [0.999956 0.999956]
    # Those 'expected' values: [1 1]

Oh, c'mon! That's close enough, right?
Notice that the test failure tells you which elements it failed at (0,0 and 1,1) and what values it got and expected.
To make it pass, I could add more sig figs to the matrix ... _oooorrr_ I could just tweak the test
with the `atol` or **absolute tolerance** option.

    is_pdl($m x $m->t, $id, {test_name => 'Orthogonal matrix times its transpose is the Identity matrix', atol => 1E-4})
    ok 3 - Orthogonal matrix times its transpose is the Identity matrix

See? Passes!

Test::PDL also checks for type, so ndarrays with the same values but different types will fail

    is_pdl double(1..5), short(1..5)
    not ok 4 - ndarrays are equal
    #     types do not match ('require_equal_types' is true)
    #          got: Double   D [5]        (P    ) [1 2 3 4 5]
    #     expected: Short    D [5]        (P    ) [1 2 3 4 5]

    is_pdl double(1..5), short(1..5), {require_equal_types => 0}
    ok 5 - ndarrays are equal

unless you pass the `require_equal_types => 0` option to the test.

Here's a good one. Careful now, it really is complex!

    $q = pdl([1, 0, 0],[0, i, sqrt(2)],[0, -sqrt(2), i])
    [
     [ 1      0       0]
     [ 0      i   1.414]
     [ 0 -1.414       i]
    ]
    $i3x3 = cdouble identity(3)
    [
     [1 0 0]
     [0 1 0]
     [0 0 1]
    ]
    is_pdl($q x $q->t, $i3x3, 'Orthogonal 3x3 complex matrix')
    ok 6 - Orthogonal 3x3 complex matrix

The default type of `zeroes()` is **double**, so without the `cdouble` to make it complex, the `is_pdl` test will fail on type.
Or you could create an [imaginary matrix](https://metacpan.org/pod/PDL::Core#i) and zero it, with `$i = i(3,3) * 0`

And remember kids, at Christmas Santa is multiplied by his [complex conjugate](https://metacpan.org/pod/PDL::Ops#conj),
because that's when [Santa is Real](https://xkcd.com/849/)!
