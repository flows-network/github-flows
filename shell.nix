{ pkgs ? import <nixpkgs> { } }:
with pkgs;
mkShell {
  buildInputs = [
    pkg-config
    openssl

    wasmedge

    nodejs

    proxychains
  ];
}
