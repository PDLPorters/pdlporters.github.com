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
