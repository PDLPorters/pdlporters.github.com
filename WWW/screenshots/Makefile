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

all:		index_de.html index_en.html ex1.html ex2.html ex3.html \
		subdirs link

subdirs:	

index_de.html:		index.wml $(FRAMEWORK) ../menue.wml
index_en.html:		index.wml $(FRAMEWORK) ../menue.wml
ex1.html:		ex1.wml $(FRAMEWORK)
ex2.html:		ex2.wml $(FRAMEWORK)
ex3.html:		ex3.wml $(FRAMEWORK)

link:		
		rm -f index.html
		cp index_en.html index.html

clean:		
		rm -fr *.html *.php3 *~

distclean:
		rm -fr *~
