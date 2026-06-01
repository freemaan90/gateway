  wsl -d podman-machine-default -- sudo podman-compose `
    --env-file /mnt/c/Users/FZANONIR/Documents/Frederico/gateway/.env `
    -f /mnt/c/Users/FZANONIR/Documents/Frederico/gateway/docker-compose.yml `
    up -d