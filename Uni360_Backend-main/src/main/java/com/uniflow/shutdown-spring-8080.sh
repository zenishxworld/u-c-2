#!/bin/bash
pkill -f "spring-boot" || pkill -f "java.*8080" || (echo "Killing process on port 8080..." && kill -9 $(lsof -ti:8080) 2>/dev/null) && echo "Spring Boot on port 8080 shutdown complete"
