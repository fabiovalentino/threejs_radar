#!/bin/sh
DIRECTORY="/var/www/http/myhost.com"
NGINX_ROOT="/etc/nginx"

if [[ ! -d "$NGINX_ROOT" ]]; then
	echo "please install nginx or change the root folder in this bash script."
	exit 0
fi

ng lint
if [ $? -eq 0 ]; then
	ng build
	if [ $? -eq 0 ]; then
		sudo rm -rf $DIRECTORY/*
		if [[ ! -d "$DIRECTORY" ]]; then
			sudo mkdir $DIRECTORY
		fi
		sudo cp -r ./dist/dev/* $DIRECTORY/
		sudo chown -R http:http $DIRECTORY
	else
		echo "ng build failed."
	fi
else
	echo "ng lint failed."
fi
