docker kill hamback
echo y | docker system prune
docker pull hamyarchat/back:latest
docker run -d --name hamback -v hamback-logs:/app/dist/logs -p 12000:12000 --restart unless-stopped hamyarchat/back:latest
docker ps