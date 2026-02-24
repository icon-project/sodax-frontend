{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20
    pnpm
    git
  ];

  shellHook = ''
    echo "Setting up Node.js development environment..."
    export NODE_ENV=development
    export PATH="$PWD/node_modules/.bin:$PATH"
  '';
}








































