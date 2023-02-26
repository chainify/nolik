#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#define KEY_SIZE 32

#define NONCE_SIZE 24

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus

char *allocate(uintptr_t size);

void deallocate(char *pointer);

char *new_encrypted_metadata(char *input);

char *decrypt_metadata(char *input);

char *encrypt_message(char *input);

char *decrypt_message(char *input);

char *generate_keypair(void);

char *generate_nonce(void);

#ifdef __cplusplus
} // extern "C"
#endif // __cplusplus
