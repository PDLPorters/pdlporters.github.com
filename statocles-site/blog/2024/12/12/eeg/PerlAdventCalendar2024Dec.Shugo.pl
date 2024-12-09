use PDL;
use PDL::NiceSlice;
use PDL::Graphics::TriD;
use PDL::Graphics::TriD::MathGraph;
use PDL::Graphics::TriD::Labels;
our @coords;
our @labels;
our $e;
our $c;
our @elecNames;
our $x;
our $y;
our $z;
our $r_h;
our $r_pos;
our $positionfile;
($r_h, $r_pos, $x, $y, $z) = &parse_ELEC_POS3D_ASA_4AdventCalendar("$ARGV[0]");
print " ... processed $h{FileComment} \n";
our $colors = [ $y + 50, $x, $z ];
&disp_3d;

sub disp_3d {
    points3d([ $x, $y, $z ], $colors, { PointSize => 8 });
    hold3d();
    $e = PDL::GraphEvolver->new(pdl(@coords));
    my $c = $e->getcoords;
    PDL::Graphics::TriD::graph_object(my $lab
            = PDL::Graphics::TriD::Labels->new($c, { Strings => \@labels }));
}

sub parse_ELEC_POS3D_ASA_4AdventCalendar
{ # ASA electrode file provided by mne_python e.g., https://github.com/mne-tools/mne-python/blob/main/mne/channels/data/montages/standard_1020.elc
    my $r_start = @_[0];
    my ($lgth, $nl, $r) = &parse_ASCII($r_start);
    my @in = @$r;
    my @epos;
    $h{total_nl}        = $nl;
    $h{filename}        = $_[0];
    $h{N_header}        = 4;
    $h{N_Coords}        = ($nl - $h{N_header} - 2) / 2;
    $h{FileComment}     = join(" ", @{ $r->[0] });
    $h{ReferenceLabel}  = $in[1][1];
    $h{UnitPosition}    = $in[2][1];
    $h{NumberPositions} = $in[3][1];
    print "Parsing $nl lines with $h{NumberPositions} locations ... ";
    for ($i = 0; $i < $nl; $i++) { $h{Labels_loc} = $i if ($in[$i][0] eq "Labels"); }
    $h{start_label} = $h{Labels_loc} + 1;
    $h{start_cord}  = $h{N_header} + 1;

    for ($i = $h{start_label}; $i < $nl; $i++) {
        my $cur = $i - $h{start_label};
        $epos[$cur]{name} = $in[$i][0];
    }
    for ($i = $h{start_cord}; $i < $h{Labels_loc}; $i++) {
        my $cur = $i - $h{start_cord};
        $epos[$cur]{x} = $in[$i][0];
        $epos[$cur]{y} = $in[$i][1];
        $epos[$cur]{z} = $in[$i][2];
    }
    for ($i = 0; $i < $h{NumberPositions}; $i++) {
        $h{ $epos[$i]{name} }{DeviceCh} = $i;
        $h{ $epos[$i]{name} }{x}        = $epos[$i]{x};
        $h{ $epos[$i]{name} }{y}        = $epos[$i]{y};
        $h{ $epos[$i]{name} }{z}        = $epos[$i]{z};
    }
    print "\n Oops, make sure $h{NumberPositions} ne $h{N_Coords} ... \n"
        if ($h{NumberPositions} ne $h{N_Coords});
    $x = zeros($h{NumberPositions});
    $y = zeros($h{NumberPositions});
    $z = zeros($h{NumberPositions});
    for ($i = 0; $i < $h{NumberPositions}; $i++) {
        if   ($epos[$i]{x} eq '') { $x ($i) .= 0; }
        else                      { $x ($i) .= $epos[$i]{x}; }
        if   ($epos[$i]{y} eq '') { $y ($i) .= 0; }
        else                      { $y ($i) .= $epos[$i]{y}; }
        if   ($epos[$i]{z} eq '') { $z ($i) .= 0; }
        else                      { $z ($i) .= $epos[$i]{z}; }
        $coords[$i] = [ $epos[$i]{x}, $epos[$i]{y}, $epos[$i]{z} ];
        $labels[$i] = "  " . "$epos[$i]{name}";
    }
    print "Done!\n";
    return (\%h, \@epos, $x, $y, $z);
}

sub parse_ASCII {
    my $filein = @_[0];
    my $nl;
    my $lgth;
    my @tmp;
    my @out2D;
    if (!-s $filein) { die("$filein is empty, quits  \n"); }
    open(IN, "$filein") or die("Cannot open: $filein for input at parse_ASCII, quits \n");
    print "reading ASCII input:$filein...\t";

    while (<IN>) {
        @tmp = split(/\s+/);
        $nl++;
        $lgth = $#tmp if $#tmp > $lgth;
        push @out2D, [@tmp];
    }
    $lgth++;
    close(IN);
    print "Done!\n";
    return ($lgth, $nl, \@out2D);
}

sub get_electrode_positions {    ## failed, sorry
    use LWP::Curl;
    my $lwpcurl = LWP::Curl->new();
    $positionfile
        = $lwpcurl->get(
        'https://github.com/mne-tools/mne-python/blob/main/mne/channels/data/montages/standard_1020.elc'
        );
}
