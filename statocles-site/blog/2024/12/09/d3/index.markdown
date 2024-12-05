---
title: Day 9: Exploring Data with D3.js and Mojolicious
disable_content_template: 1
tags:
    - visualization
    - Mojolicious
    - D3.js
    - 'random graph'
author: Boyd Duffee
images:
  banner:
    src: './banner.png'
    alt: 'Mojolicious and D3.js logos'
    data:
      attribution: |-
        <a href="https://www.flickr.com/photos/64500102@N05/5972411305">Crew Player Combinations: Defenders</a>" by <a href="https://www.flickr.com/photos/64500102@N05">Bernhardt Soccer</a> and Boyd Duffee is licensed under <a href="https://creativecommons.org/licenses/by-sa/2.0/?ref=openverse">CC BY-SA 2.0</a>
data:
  bio: duffee
  description: Using JavaScript to display data generated from PDL
---

Sometimes PDL doesn't scratch the particular itch you have.
PDL isn't like Vegas. It doesn't have to stay there.
After crunching your data, you can get it out to Perl and beyond.
---

As any Yule fule know, PDL has
[plenty of graphing options](https://metacpan.org/pod/PDL::Graphics)
so I'll need something unusual to make it worth the time.
I was impressed by [D3.js](https://d3js.org/what-is-d3),
a JavaScript library for visualising data, especially its force layout for networks.

## Making a Random Graph

People have been studying
[Random Graphs](https://en.wikipedia.org/wiki/Erd%C5%91s%E2%80%93R%C3%A9nyi_model)
for over 60 years and they are a starting point for research into
[Complex Networks](https://en.wikipedia.org/wiki/Complex_network)
such as social networks.
I'm not too fussed about the actual network produced here,
so for now let's just create a matrix filled with random values
and create links for everything above a chosen cutoff value.
Keen Graph-heads might want to look at the
[Graph::Maker::Random](https://metacpan.org/pod/Graph::Maker::Random)
module for a more rigorous approach to creating Random Graphs.

A network can be represented by a square matrix
where a link between nodes **i** and **j** is represented
by a `1` in element `ij` and `0` elsewhere.
To do that we create a
[random](https://metacpan.org/pod/PDL::Primitive#random)
matrix with `$matrix = random($size, $size)`
and zero everything below the cutoff
with `$matrix->where( $matrix < $cutoff ) .= 0`
(lines 12 and 13)
using the [where](https://metacpan.org/pod/PDL::Primitive#where) function.
Having created our network, let's export it to Perl with
[unpdl](https://pdl.perl.org/?docs=PDL::Core#unpdl).
That gives us an arrayref of arrayrefs which we use to decide
when to push a hashref onto `@links` (line 21 and 22).
`@nodes` and `@links` are then
[spewed](https://docs.mojolicious.org/Mojo/File#spew)
into a [JSON file](https://docs.mojolicious.org/Mojo/JSON)
which D3 will display for us.

## Serving web pages with Mojolicious

A neat little trick with Mojolicious is using the
[Mojolicious::Lite](https://docs.mojolicious.org/Mojolicious/Lite) application
to get a one-file webapp up and running with the
[minimum of fuss.](https://mojolicious.io/blog/2017/12/01/day-1-getting-started/)
Because it's all just Perl, I can create the network and export the JSON
all in the same webapp that serves the page.
Using the [morbo](https://docs.mojolicious.org/morbo) development server
means your saved changes are immediate reflected in the pages served.

Save the code here as **display_network.pl**,
create a directory named **public** to hold the JSON file and any CSS files used
and run it with `morbo display_network.pl`

Every time you browse to [localhost:3000](http://localhost:3000/),
the [get](https://docs.mojolicious.org/Mojolicious/Lite#get) sub will
create a new network and then render the **index** template
to display the JSON file using the D3.js
[force layout.](https://www.d3indepth.com/force-layout/)

Mojo fans will immediately see how to modify the route
so you can play with different values for size and cutoff
without editing the file each time.
The original example that impressed me so much is from
[a decade old book](https://www.safaribooksonline.com/library/view/title/9781449328788//)
when D3 was in version 3.0 (it's now version 7.0).
because you could play around with the network using your mouse
to tease out the structure.
It's been difficult to find a current force layout example I like
which I could just drop into place, so I just grabbed
[this one](http://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048)
and keen D3.js users can fix the interactive bits that I've missed.

## Christmas morning

I had only a vague idea of what a random graph looked like when I started.
I was thinking that I'd need a cutoff value of 0.3 or 0.5 to get a loosely connected network.
After I got this tangled ball of Christmas lights,
I kept raising and raising the cutoff until 0.9 (or only 10% chance of 2 nodes being linked)
started giving me the result that I had in my head.
You'll notice that my simple generator creates nodes that are not connected
to any other in the network.
It makes me smile as they go flying off the screen,
like baubles do when you bump into the Christmas tree.

Have fun!

(with more time, I'd have liked to make the nodes random colours, too)

## All the code

Save this as [display_network.pl](display_network.pl)

    #!/usr/bin/env perl
    use Mojolicious::Lite -signatures;

    use Mojo::File;
    use Mojo::JSON qw(to_json);
    use PDL;

    sub create_network ($size = 50, $cutoff = 0.925) { # signatures available on Perl 5.20+
        #my ($size, $cutoff) = @_;                     # otherwise uncomment these 2 lines
        #$size ||= 50; $cutoff ||= 0.925;

        my $matrix = random($size, $size);
        $matrix->where( $matrix < $cutoff ) .= 0;

        my $network = unpdl( $matrix );
        my @nodes   = map { { id => $_ } } 0 .. ($size - 1);

        my @links;
        for (my $i = 0; $i < $size; $i++) {
            for (my $j = $i; $j < $size; $j++) {
                push @links, { source => $i, target => $j }
                    if $network->[$i][$j] > 0;
            }
        }

        my $json = to_json { nodes => \@nodes, links => \@links };
        Mojo::File->new('public/random_network.json')->spew($json);
    }

    get '/' => sub ($c) {
      create_network();
      $c->render(template => 'index');
    };

    app->start;
    __DATA__

    @@ index.html.ep
    % layout 'default';
    % title 'Network example';
    <h1>Random Network displayed with D3.js force layout</h1>
    <div id="content"></div>

    @@ layouts/default.html.ep
    <!DOCTYPE html>
    <html>
      <head><title><%= title %></title>
      %= stylesheet '/network.css'
      %# stylesheets and js file names are relative to the public folder
        <meta name="description" content="force directed graph example" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js" charset="utf-8"></script>
        <style>
          circle {
            stroke: #fff;
            stroke-width: 1;
          }

          .link {
            stroke: #999;
            stroke-opacity: 0.6;
          }
        </style>
      </head>
      <body>
        <%= content %>
        <script>
          // Original demo from Mike Bostock: http://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048

          const margin = {
            top: 40,
            bottom: 10,
            left: 20,
            right: 20,
          };
          const width = 800 - margin.left - margin.right;
          const height = 600 - margin.top - margin.bottom;

          // Creates sources <svg> element and inner g (for margins)
          const svg = d3
            .select("#content")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

          /////////////////////////

          const simulation = d3
            .forceSimulation()
            .force(
              "link",
              d3.forceLink().id((d) => d.id)
            )
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

          const color = d3.scaleOrdinal(d3.schemeCategory10);

          d3.json("random_network.json").then((data) => {
            // Links data join
            const link = svg
              .selectAll(".link")
              .data(data.links)
              .join((enter) => enter.append("line").attr("class", "link"));

            // Nodes data join
            const node = svg
              .selectAll(".node")
              .data(data.nodes)
              .join((enter) => {
                const node_enter = enter.append("circle").attr("class", "node").attr("r", 10);
                node_enter.append("title").text((d) => d.id);
                return node_enter;
              });

            node.style("fill", (d) => color(d.group));

            simulation.nodes(data.nodes).force("link").links(data.links);

            simulation.on("tick", (e) => {
              link
                .attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);

              node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
            });
          });
        </script>
      </body>
    </html>

and save this as [public/network.css](network.css)

    body {
      max-width: 800px;
      margin: 25px auto;
      font-family: "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
    }

    circle {
      stroke:black;
      stroke-width:1px;
      fill:MediumSeaGreen;
      opacity:0.5;
    }

