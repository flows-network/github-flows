{ pkgs ? import <nixpkgs> { } }:
with pkgs;
mkShell {
  buildInputs = [
    openapi-generator-cli
    tokei
    pkg-config
    openssl
    wasmedge
  ];
}
