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
		intro_de.html intro_en.html \
		plot2D_de.html plot2D_en.html \
		bad1_de.html bad1_en.html \
		bad2_de.html bad2_en.html \
		subdirs link

subdirs:	

index_de.html:		index.wml $(FRAMEWORK) ../menue.wml
index_en.html:		index.wml $(FRAMEWORK) ../menue.wml
intro_de.html:		intro.wml $(FRAMEWORK) ../menue.wml
intro_en.html:		intro.wml $(FRAMEWORK) ../menue.wml
plot2D_de.html:		plot2D.wml $(FRAMEWORK) ../menue.wml
plot2D_en.html:         plot2D.wml $(FRAMEWORK) ../menue.wml
bad1_de.html:		bad1.wml $(FRAMEWORK) ../menue.wml
bad1_en.html:		bad1.wml $(FRAMEWORK) ../menue.wml
bad2_de.html:		bad2.wml $(FRAMEWORK) ../menue.wml
bad2_en.html:           bad2.wml $(FRAMEWORK) ../menue.wml

link:		
		rm -f index.html
		cp index_en.html index.html

clean:		
		rm -fr *.html *.php3 *~

distclean:
		rm -fr *~
