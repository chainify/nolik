ifeq ($(shell uname),Darwin)
    EXT := dylib
else
    EXT := so
endif

TDIR := ../../../target/release
LIB := $(TDIR)/libnolik_metadata.$(EXT)

all: $(LIB)
	g++ test.cpp -L $(TDIR)/ -lnolik_metadata -o run
	LD_LIBRARY_PATH=$(TDIR) ./run

$(LIB): ../src/lib.rs ../Cargo.toml
	cargo rustc --crate-type cdylib --release --features ffi

clean:
	rm -rf $(LIB)
	rm -rf run
