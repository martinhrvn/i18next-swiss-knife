{ pkgs, lib, config, ... }: {
  packages = [
    pkgs.nodejs
    pkgs.electron
    pkgs.chromium
  ];

  languages.javascript = {
    enable = true;
    npm = {
      enable = true;
      install.enable = true;
    };
  };
scripts.electron-run.exec = ''
    ${pkgs.electron}/bin/electron .
  '';
  env = {
    PATH = "${pkgs.electron}/bin:${pkgs.chromium}/bin:$PATH";
  };
enterShell = ''
    export PATH="${pkgs.electron}/bin:${pkgs.chromium}/bin:$PATH"
    echo "Electron and Chromium added to PATH"
    echo "Available commands: electron, chromium"
  '';
}
