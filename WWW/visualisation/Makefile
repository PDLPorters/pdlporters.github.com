
         ROOT = ..
    FRAMEWORK = $(ROOT)/templates/menue_top.wml \
		$(ROOT)/templates/menue_main.wml \
		$(ROOT)/templates/menue_bottom.wml \
                $(ROOT)/templates/background.wml \
                $(ROOT)/templates/header.wml \
                $(ROOT)/templates/footer.wml
INC_TEMPLATES = -I../templates

.SUFFIXES: .html .wml

%.html:
		wml $(INC_TEMPLATES) $< -o $@

all:		index_de.html index_en.html \
		subdirs

subdirs:	

index_de.html:		index.wml $(FRAMEWORK)
index_en.html:		index.wml $(FRAMEWORK)

clean:		
		rm -fr *_en.html *_de.html *~

distclean:
		rm -fr *~
