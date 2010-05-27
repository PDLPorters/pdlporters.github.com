# might barf on non GNU makes
.SUFFIXES: .html .shtml

all:

clean:		
		rm -fr *~
		(cd acknowledge && rm -fr *~)
		(cd demos && rm -fr *~)
		(cd development && rm -fr *~)
		(cd documentation && rm -fr *~)
		(cd download && rm -fr *~)
		(cd libraries && rm -fr *~)
		(cd maillists && rm -fr *~)
		(cd nifty && rm -fr *~)
		(cd screenshots && rm -fr *~)
		(cd team && rm -fr *~)

distclean:
		rm -fr *~

realclean: 	distclean
	   	rm -f pdlwww.tar.gz
dist:
	perl util/selectfiles > .mirror
	cat .mirror |perl util/selectdirs > .dirs
	echo './.mirror' >> .mirror
	echo './.dirs' >> .mirror
	tar -zcf pdlwww.tar.gz  --files-from=.mirror
