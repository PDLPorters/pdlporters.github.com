use strict;
use warnings;
use PDL;
use PDL::NiceSlice;
use PDL::Graphics::TriD;
use PDL::Graphics::TriD::Labels;

our $verbose = 1;
my ($r_h, $r_pos, $labels, $x, $y, $z) = parse_ELEC_POS3D_ASA_4AdventCalendar($ARGV[0]);
print " ... processed $r_h->{FileComment} \n" if $verbose;
disp_3d($labels, $x, $y, $z);

sub disp_3d {
    my ($labels, $x, $y, $z) = @_;
    points3d([ $x, $y, $z ], [ $y + 50, $x, $z ], { PointSize => 8 });
    hold3d();
    PDL::Graphics::TriD::graph_object(my $lab
            = PDL::Graphics::TriD::Labels->new([ $x, $y, $z ], { Strings => $labels }));
}

sub parse_ELEC_POS3D_ASA_4AdventCalendar
{ # ASA electrode file provided by mne_python e.g., https://github.com/mne-tools/mne-python/blob/main/mne/channels/data/montages/standard_1020.elc
    my ($r_start) = @_;
    my ($lgth, $nl, $r) = parse_ASCII($r_start);
    my @in = @$r;
    my (@epos, @labels, %h);
    $h{total_nl}        = $nl;
    $h{filename}        = $r_start;
    $h{N_header}        = 4;
    $h{N_Coords}        = ($nl - $h{N_header} - 2) / 2;
    $h{FileComment}     = join(" ", @{ $in[0] });
    $h{ReferenceLabel}  = $in[1][1];
    $h{UnitPosition}    = $in[2][1];
    $h{NumberPositions} = $in[3][1];
    print "Parsing $nl lines with $h{NumberPositions} locations ... " if $verbose;
    for my $i (0..$nl) { $h{Labels_loc} = $i if ($in[$i][0]//'') eq "Labels"; }
    $h{start_label} = $h{Labels_loc} + 1;
    $h{start_cord}  = $h{N_header} + 1;
    for my $i ($h{start_label}..$nl-1) {
        $epos[$i - $h{start_label}]{name} = $in[$i][0];
    }
    for my $i ($h{start_cord}..$h{Labels_loc}-1) {
        @{$epos[$i - $h{start_cord}]}{qw(x y z)} = @{$in[$i]};
    }
    for my $i (0..$h{NumberPositions}-1) {
        $h{ $epos[$i]{name} }{DeviceCh} = $i;
        @{ $h{ $epos[$i]{name} } }{qw(x y z)} = @{ $epos[$i] }{qw(x y z)};
    }
    warn "\n Oops, make sure $h{NumberPositions} ne $h{N_Coords} ... \n"
        if $h{NumberPositions} ne $h{N_Coords};
    my $coords = zeroes(float, 3, $h{NumberPositions});
    for my $i (0..$h{NumberPositions}-1) {
        $coords(,$i) .= pdl(map $_ || 0, @{$epos[$i]}{qw(x y z)});
        $labels[$i] = "  " . "$epos[$i]{name}";
    }
    print "Done!\n" if $verbose;
    return (\%h, \@epos, \@labels, $coords->using(0,1,2));
}

sub parse_ASCII {
    my ($filein) = @_;
    if (!-s $filein) { die("$filein is empty, quits  \n"); }
    open my $fh, "<", $filein or die "Cannot open: $filein for input at parse_ASCII$!";
    print "reading ASCII input:$filein...\t" if $verbose;
    my ($nl, $lgth, @out2D) = (0,0);
    while (<$fh>) {
        my @tmp = split(/\s+/);
        $nl++;
        $lgth = @tmp if @tmp > $lgth;
        push @out2D, \@tmp;
    }
    print "Done!\n" if $verbose;
    ($lgth, $nl, \@out2D);
}
