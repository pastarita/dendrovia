#!/bin/bash
# Kill any processes occupying playground ports (3010-3016)
for port in 3010 3011 3012 3013 3014 3015 3016; do
  pid=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid
    echo "Killed port :$port (pid $pid)"
  fi
done
echo "Ports 3010-3016 clear"
