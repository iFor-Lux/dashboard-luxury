@echo off
set "GIT_AUTHOR_NAME=iFor-Lux"
set "GIT_AUTHOR_EMAIL=jhojantomairo2@gmail.com"
set "GIT_COMMITTER_NAME=iFor-Lux"
set "GIT_COMMITTER_EMAIL=jhojantomairo2@gmail.com"

:: Configurar Git
git config user.name "%GIT_AUTHOR_NAME%"
git config user.email "%GIT_AUTHOR_EMAIL%"

:: Hacer commit y push
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
