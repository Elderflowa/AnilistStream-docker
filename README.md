<img
  src="https://github.com/Saadiq8149/AnilistStream/blob/1cba2e46de9e627f1607d6782e2790193cdad501/public/logo.png"
  alt="AnilistStream Logo"
  width="56"
  height="56"
/>

# anistream-docker — a fork of AnilistStream for selfhosting
[![Docker Image Version (latest semver)](https://img.shields.io/docker/v/elderflowa/anistream-docker?label=elderflowa%2Fanistream-docker%3Alatest)](https://hub.docker.com/r/elderflowa/anistream-docker)

**anistream-docker** is a fork of Saadiq8149's [AnilistStream](https://github.com/Saadiq8149/AnilistStream) that provides **HTTP-based anime streaming**) with AniList integration.<br>
It is designed to with focus on selfhosting and running locally, instead of using the provided server and Anilist application.

## Prerequisites
- Anilist account and application
- Docker and Docker Compose
- Git and Curl

## Screenshot
| Configuration Page                                                                             |
| ---------------------------------------------------------------------------------------------- |
| <img src="https://raw.githubusercontent.com/Elderflowa/AnilistStream-docker/refs/heads/main/configuration.png" alt="Configuration" /> |
---
## Pre-built image
Available on **Docker Hub**:
```
docker pull elderflowa/anistream-docker
```
---
## Building from source
Clone this repository:
```
git clone https://github.com/Elderflowa/AnilistStream-docker
cd anistream-docker
```
Build the image:
```
docker build -t anistream-docker:latest -f Dockerfile .
```
---
## Running the container
Use the `example-compose.yaml` file:
```
curl -o compose.yaml https://raw.githubusercontent.com/Elderflowa/AnilistStream-docker/main/example-compose.yaml
```
Then run it with `docker compose up -d`

---
## More information
Take a look at Saadiq8149's [original repository](https://github.com/Saadiq8149/AnilistStream).
## License

This project is provided **as-is** for personal use.

---

## Acknowledgements

This addon uses a slightly modified version of **ani-cli**  
to discover and retrieve anime streaming sources.

https://github.com/pystardust/ani-cli
