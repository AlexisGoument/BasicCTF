# Docker

## Installation

https://www.docker.com/get-started/

## Getting Started

### Run Docker Container
Cette image docker permet de disposer des outils nécessaires pour réaliser les challenges de l'application BasicCTF.

Pour construire l'image en local
```bash
sudo docker build -t basic-ctf:latest .
```

Pour démarrer le container
```bash
docker run --rm -it \
  -p 3000:3000 \
  basic-ctf:latest \
  bash
```

### Run WebApp
Une fois dans le container, vous pouvez démarrer l'application web avec la commande suivante:

```bash
cd app
npm install
npm start &
```

Vous pouvez ensuite accéder à l'application web via votre navigateur à l'adresse suivante: http://localhost:3000

## Tooling
Le container vient avec les outils suivants:

```bash
cat packages.txt
```

Vous pouvez installer d'autres outils via apt-get.
```bash
apt-get install <nom_du_package>
```