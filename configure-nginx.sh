#!/bin/bash
NGINX_ROOT="/etc/nginx"
if [[ ! -d "$NGINX_ROOT" ]]; then
	echo "please install nginx or change the root folder in this bash script."
	exit 0
fi

reload_nginx () {
	cp myhost.nginx.template myhost.nginx
	echo "upstream myhost { server $1:8123; }" >> myhost.nginx
	sudo cp myhost.nginx $NGINX_ROOT/sites-available/myhost.com
	if [[ ! -f "$NGINX_ROOT/sites-enabled/myhost.com" ]]; then
		sudo ln -s $NGINX_ROOT/sites-available/myhost.com $NGINX_ROOT/sites-enabled/myhost.com
	fi
	sudo systemctl reload nginx
	exit 0
}


endpoint="$1"
if [ "$endpoint" == "" ]; then
	echo "usage: ./configure-nginx.sh HOSTNAME"
	exit 0
fi
mapfile -t localips < <( nmap -n -sn 192.168.1.0/24 -oG - | awk '/Up$/{print $2}' )

for var in "${localips[@]}"
do
  hostname=$(nmblookup -A "${var}" | grep '<00' | grep -v GROUP | awk '{print $1}')
  echo "${var} - $hostname"
  if [ "$hostname" == "$endpoint" ]; then
    echo "found hostname"
    reload_nginx "${var}"
  fi
done

mapfile -t tunips < <( nmap -n -sn 10.8.66.0/24 -oG - | awk '/Up$/{print $2}' )

for var in "${tunips[@]}"
do
  hostname=$(nmblookup -A "${var}" | grep '<00' | grep -v GROUP | awk '{print $1}')
  echo "${var} - $hostname"
  if [ "$hostname" == "$endpoint" ]; then
    echo "found hostname" 
    reload_nginx "${var}"
  fi
done
