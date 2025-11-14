FROM kalilinux/kali-rolling:latest

COPY packages.txt packages.txt
COPY app app

RUN apt update && apt install -y $(cat packages.txt)
