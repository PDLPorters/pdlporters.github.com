# might barf on non GNU makes
ifndef WML
	WML = wml
endif

         ROOT = .
    FRAMEWORK = $(ROOT)/templates/menue_top.wml \
		$(ROOT)/templates/menue_bottom.wml \
                $(ROOT)/templates/top.wml \
                $(ROOT)/templates/bottom.wml \
                $(ROOT)/templates/footer.wml
INC_TEMPLATES = -Itemplates

.SUFFIXES: .html .wml

%.html:	
		$(WML) $(INC_TEMPLATES) $< -o $@

all:		index_de.html index_en.html index_es.html\
		oldnews_de.html oldnews_en.html oldnews_es.html\
		subdirs \
		link

subdirs:	
		(cd screenshots && $(MAKE) all)
		(cd documentation && $(MAKE) all)
		(cd download && $(MAKE) all)
		(cd libraries && $(MAKE) all)
		(cd maillists && $(MAKE) all)
		(cd development && $(MAKE) all)
		(cd team && $(MAKE) all)
		(cd demos && $(MAKE) all)
	        (cd nifty && $(MAKE) all)

index_de.html:	index.wml $(FRAMEWORK) menue.wml
index_en.html:	index.wml $(FRAMEWORK) menue.wml
index_es.html:	index.wml $(FRAMEWORK) menue.wml

oldnews_de.html:oldnews.wml $(FRAMEWORK) menue.wml
oldnews_en.html:oldnews.wml $(FRAMEWORK) menue.wml
oldnews_es.html:oldnews.wml $(FRAMEWORK) menue.wml

link:		
		rm -f index.html
		cp index_en.html index.html

clean:		
		rm -fr *_en.html *_de.html *~
		(cd screenshots && $(MAKE) clean)
		(cd documentation && $(MAKE) clean)
		(cd download && $(MAKE) clean)
		(cd libraries && $(MAKE) clean)
		(cd maillists && $(MAKE) clean)
		(cd development && $(MAKE) clean)
		(cd team && $(MAKE) clean)
		(cd demos && $(MAKE) clean)

distclean:
		rm -fr *~

dist:	all
	perl util/selectfiles > .mirror
	echo './.mirror' >> .mirror
	tar -zcf pdlwww.tar.gz  --files-from=.mirror
