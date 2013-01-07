#!/usr/bin/env perl

use Mojolicious::Lite;

use Cwd;
app->static->paths->[0] = getcwd;

get '/' => sub {
  shift->render_static('index.html');
};

app->start;

