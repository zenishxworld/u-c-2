#!/bin/bash

# Kafka Startup Script for EC2
# Based on the KRaft mode configuration

set -e

echo "Starting Kafka setup..."

# Download and extract Kafka if not already done
if [ ! -d "/home/ec2-user/kafka" ]; then
    echo "Downloading Kafka 3.9.0..."
    cd /home/ec2-user
    wget https://downloads.apache.org/kafka/3.9.0/kafka_2.13-3.9.0.tgz
    tar -xzf kafka_2.13-3.9.0.tgz
    mv kafka_2.13-3.9.0 kafka
    rm kafka_2.13-3.9.0.tgz
fi

# Set environment variables
export KAFKA_HOME=/home/ec2-user/kafka
export PATH=$PATH:$KAFKA_HOME/bin

# Create log directory
mkdir -p /tmp/kraft-combined-logs

# Generate cluster ID if not set
if [ -z "$KAFKA_CLUSTER_ID" ]; then
    export KAFKA_CLUSTER_ID=$(kafka-storage.sh random-uuid)
    echo "Generated Kafka Cluster ID: $KAFKA_CLUSTER_ID"
fi

# Get the public IP for advertised listeners
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Public IP: $PUBLIC_IP"

# Update server.properties with public IP
sed -i "s/advertised.listeners=PLAINTEXT:\/\/localhost:9092/advertised.listeners=PLAINTEXT:\/\/$PUBLIC_IP:9092/" /home/ec2-user/server.properties

# Format storage (only runs once)
echo "Formatting Kafka storage..."
kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c /home/ec2-user/server.properties --ignore-formatted

# Start Kafka
echo "Starting Kafka server..."
kafka-server-start.sh /home/ec2-user/server.properties
