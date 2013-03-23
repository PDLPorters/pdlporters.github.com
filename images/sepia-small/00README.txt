# This was the cropping from the screenshots of PDL Book First Steps
# with PDL::Graphics::Simple and on cygwin with gnuplot
for f   in *.png ; do convert $f   -crop 628x600+93+30 trim/$f  ; done
for png in *.png ; do convert $png -resize 33%         by3/$png ; done
