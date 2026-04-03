DIAGRAMS_BLOG_SRC := $(shell find content/blog -name '*.d2' 2>/dev/null)

DIAGRAMS_DARK  := $(patsubst content/blog/%.d2,assets/diagrams/%-dark.svg,$(DIAGRAMS_BLOG_SRC))
DIAGRAMS_LIGHT := $(patsubst content/blog/%.d2,assets/diagrams/%-light.svg,$(DIAGRAMS_BLOG_SRC))

.PHONY: diagrams serve build

diagrams: $(DIAGRAMS_DARK) $(DIAGRAMS_LIGHT)

assets/diagrams/%-dark.svg: content/blog/%.d2
	@mkdir -p $(dir $@)
	d2 --theme 200 $< $@

assets/diagrams/%-light.svg: content/blog/%.d2
	@mkdir -p $(dir $@)
	d2 --theme 0 $< $@

serve: diagrams
	hugo server --disableFastRender

build: diagrams
	hugo --minify
