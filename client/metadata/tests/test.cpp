#include <stdio.h>

#include "../metadata.h"

int main(int argc, char const *argv[]) {
  char *pair = generate_keypair();
  printf("%s\n", pair);
  return 0;
}
