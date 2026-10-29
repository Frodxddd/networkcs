<?php
/**
 * Plugin Name: Reverse Proxy SSL Detection
 * Description: Ensures WordPress correctly detects SSL when behind Nginx reverse proxy.
 */
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
}
