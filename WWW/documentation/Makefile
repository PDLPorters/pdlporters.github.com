# might barf on non GNU makes
ifndef WML
	WML = wml
endif


         ROOT = ..
    FRAMEWORK = $(ROOT)/templates/top.wml \
		$(ROOT)/templates/menue_top.wml \
		$(ROOT)/templates/menue_bottom.wml \
                $(ROOT)/templates/bottom.wml \
                $(ROOT)/templates/footer.wml
INC_TEMPLATES = -I../templates

.SUFFIXES: .html .wml

%.html:
		$(WML) $(INC_TEMPLATES) $< -o $@

all:		index_de.html index_en.html \
		subdirs \
		link

subdirs:	

index_de.html:		index.wml $(FRAMEWORK)
index_en.html:		index.wml $(FRAMEWORK)

link:		
		rm -f index.html
		ln -s index_en.html index.html
clean:		
		rm -fr *.html *.php3 *~

distclean:
		rm -fr *~
