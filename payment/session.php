<?php

error_reporting(E_ALL);
ini_set("display_errors", 1);

//////////////////////
// configuration file
//////////////////////
include_once('config.php');

////////////////
// mini curl
////////////////
function mini_curl($url, $options = false, $bypass = false) {
	if (!function_exists('curl_init')) {
		trigger_error(__FUNCTION__.'(): cURL support is not available',E_USER_ERROR);
		return false;
	}
	// Initialize cURL session
	if (false === $ch = curl_init($url)) {
		trigger_error(__FUNCTION__.'(): cURL could not be initialized',E_USER_WARNING);
	}

	// If incoming OAUTH options are set
	if ($options) {
		$curl_options = $options;
	} else {
		// Set cURL options and execute
		$curl_options = array(
			CURLOPT_URL => $url,
			CURLOPT_FILETIME => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_NOBODY => (!$bypass)// true uses HEAD instead of GET
		);
	}

	curl_setopt_array($ch, $curl_options);
	$body = curl_exec($ch);

	// Get attributes
	$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

	// unsuccessful requests (non 2xx HTTP codes)
	if (!is_int($http_code) || $http_code < 200 || $http_code > 299) {
		trigger_error(__FUNCTION__.'(): unsuccessful request. code:'.$http_code, E_USER_WARNING);
		curl_close($ch);
		return false;
	}
	
	curl_close($ch);
	return $body;
}
////////////////
// JSON output
////////////////
function json_output($x) {
	header('Content-type: application/json; charset=utf-8');
	echo json_encode($x);
	exit();
}

///////////////////////////////
// simple request validation
///////////////////////////////

if (empty($_REQUEST['validationUrl'])) {
	json_output(false);
}
if (empty($_REQUEST['domainName'])) {
	json_output(false);
}
if (empty($_REQUEST['displayName'])) {
	json_output(false);
}

///////////////////////////////
// validate URL
///////////////////////////////

///////////////////////////////
// set variables
///////////////////////////////
$domain_name = $_REQUEST['domainName'];
$display_name = $_REQUEST['displayName'];
$url = $_REQUEST['validationUrl'];


$payload = array(
	'domainName' => $domain_name,
	'displayName' => $display_name,
	'merchantIdentifier' => MERCHANT_IDENTIFIER
);
$payload = json_encode($payload);
$options = array(
	CURLOPT_URL => $url,
	CURLOPT_VERBOSE => true,
	CURLOPT_POST => true,
	CURLOPT_POSTFIELDS => $payload,
	CURLOPT_HTTPHEADER => array(
		'Content-Type: application/json',
		'Content-Length: '.strlen($payload)
	),
	CURLOPT_RETURNTRANSFER => true,
	CURLOPT_TIMEOUT => 30,
	CURLOPT_SSL_VERIFYPEER => true,
	CURLOPT_SSL_VERIFYHOST => 2,
	CURLOPT_SSLCERT => CERTIFICATE_PATH,
	CURLOPT_SSLKEY => CERTIFICATE_PATH
);

$result = mini_curl($url, $options);

header('Content-type: application/json; charset=utf-8');
echo $result;
/*?>*/