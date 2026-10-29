<?php
/**
 * Safe sanitized configuration for WordPress (SecDash / Course Submission)
 * 
 * NOTE: For security reasons, all database passwords, secret keys, 
 * and authentication salts have been redacted. 
 * This file demonstrates the production server configuration safely.
 */

// ** Database settings - Configured on Azure VM ** //
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', 'wpuser' );
define( 'DB_PASSWORD', '********_REDACTED_FOR_SECURITY_********' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 * Change these to unique phrases using the WordPress.org secret-key service.
 */
define( 'AUTH_KEY',         'put your unique phrase here (REDACTED)' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here (REDACTED)' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here (REDACTED)' );
define( 'NONCE_KEY',        'put your unique phrase here (REDACTED)' );
define( 'AUTH_SALT',        'put your unique phrase here (REDACTED)' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here (REDACTED)' );
define( 'LOGGED_IN_SALT',   'put your unique phrase here (REDACTED)' );
define( 'NONCE_SALT',       'put your unique phrase here (REDACTED)' );

/**
 * WordPress database table prefix.
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 */
define( 'WP_DEBUG', false );

/**
 * Reverse Proxy HTTPS Detection
 */
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
}

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
