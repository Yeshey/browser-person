{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs = { self, nixpkgs, systems, ... }:
  let
    eachSystem = nixpkgs.lib.genAttrs (import systems);
  in
  {
    devShells = eachSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_24          # LTS that works well with transformers.js
            nodePackages.npm   # explicit npm
            git
            # Optional helpers for a typical web front-end
            # (uncomment what you plan to use)
            # vite
            # parcel
            # typescript
            # esbuild
          ];

          shellHook = ''
            echo "to get started:"
            echo "npm install"
          '';
        };
      });
  };
}