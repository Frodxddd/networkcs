#!/usr/bin/env bash
# ==============================================================================
# Linux iptables & ipset Firewall Configuration Script (GeoIP & Multi-Layer Defense)
# Project: Cloud Web Server Hardening (Burapha University)
# ==============================================================================

set -euo pipefail

echo "[+] Initializing ipset for Thailand IP ranges..."
sudo ipset create th_allow hash:net -exist

# Note: In production, Thailand CIDR blocks are loaded into th_allow:
# curl -s https://www.ipdeny.com/ipblocks/data/countries/th.zone | while read -r subnet; do
#     sudo ipset add th_allow "$subnet" -exist
# done

echo "[+] Configuring iptables filter chains..."

# 1. Set default policies
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# 2. Allow Loopback (Localhost)
sudo iptables -A INPUT -i lo -j ACCEPT

# 3. Allow Established and Related connections
sudo iptables -A INPUT -m ctstate --state RELATED,ESTABLISHED -j ACCEPT

# 4. Allow Azure internal infrastructure communication
sudo iptables -A INPUT -s 168.63.129.16 -j ACCEPT
sudo iptables -A INPUT -s 169.254.169.254 -j ACCEPT

# 5. Allow DHCP (UDP 67/68)
sudo iptables -A INPUT -p udp --sport 67 --dport 68 -j ACCEPT

# 6. Allow Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) ONLY from Thailand (th_allow)
sudo iptables -A INPUT -p tcp -m multiport --dports 22,80,443 -m set --match-set th_allow src -j ACCEPT

echo "[+] Firewall rules successfully applied!"
