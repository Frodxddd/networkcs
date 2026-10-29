<?php
/**
 * Plugin Name: Enterprise Security Hardening & Zero-Trust Policies
 * Description: Fixes CORS arbitrary reflection, blocks REST user enumeration, removes WordPress version disclosures everywhere.
 */

// Disable script concatenation on login/admin so individual scripts are filtered
defined('CONCATENATE_SCRIPTS') || define('CONCATENATE_SCRIPTS', false);

// 1. BLOCK REST API USER ENUMERATION
add_filter('rest_endpoints', function($endpoints) {
    if (!is_user_logged_in()) {
        if (isset($endpoints['/wp/v2/users'])) {
            unset($endpoints['/wp/v2/users']);
        }
        if (isset($endpoints['/wp/v2/users/(?P<id>[\\d]+)'])) {
            unset($endpoints['/wp/v2/users/(?P<id>[\\d]+)']);
        }
    }
    return $endpoints;
});

// 2. STRICT CORS CONTROLS: Prevent arbitrary Origin reflection with credentials
add_filter('rest_pre_serve_request', function($value) {
    $origin = get_http_origin();
    $trusted = [
        'https://nenenainaemak.duckdns.org',
        'http://nenenainaemak.duckdns.org',
        'http://localhost',
        'http://127.0.0.1'
    ];
    if ($origin && in_array($origin, $trusted, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: OPTIONS, GET, POST, PUT, PATCH, DELETE');
        header('Access-Control-Allow-Headers: Authorization, X-WP-Nonce, Content-Type');
    } else {
        header('Access-Control-Allow-Origin: https://nenenainaemak.duckdns.org');
        header('Access-Control-Allow-Credentials: false');
    }
    return $value;
}, 999);

// 3. REMOVE ALL WORDPRESS VERSION DISCLOSURES (FRONTEND + LOGIN + HEADERS)
remove_action('wp_head', 'wp_generator');
remove_action('login_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

function remove_wp_ver_query($src) {
    if ($src && strpos($src, 'ver=') !== false) {
        $src = remove_query_arg('ver', $src);
    }
    return $src;
}
add_filter('style_loader_src', 'remove_wp_ver_query', 9999);
add_filter('script_loader_src', 'remove_wp_ver_query', 9999);

add_filter('get_bloginfo_rss', function($val, $show) {
    if ($show === 'version') return '';
    return $val;
}, 10, 2);

// 4. PRESERVE INLINE JAVASCRIPT IN FULL HTML PAGES (Prevent wptexturize entity corruption)
remove_filter('the_content', 'wptexturize');

