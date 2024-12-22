#!/usr/bin/env perl

use Mojolicious::Lite -signatures;

use Cwd;
app->static->paths->[0] = getcwd;

get '/*whatever' => {whatever => 'index.html'} => sub ($c) {
  $c->reply->static($c->stash('whatever') =~ s#/$#/index.html#r);
};

app->start;
