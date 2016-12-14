<?php

//////////////////////
// debug options
//////////////////////
error_reporting(E_ALL);
ini_set("display_errors", 1);

//////////////////////
// configuration
//////////////////////
// Note: some files are not included on purpose, these were only added to obfuscate values being used for testing. Use the 
// example version to create your own.
include_once('config.php');//include_once('config-example.php');

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
$url = $_REQUEST['validationURL'];


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

//////////////////////
// curl request
//////////////////////
// Note: some files are not included on purpose, these were only added to obfuscate values being used for testing. Use the 
// example version to create your own.
$result = curl_handler($url, $options);

header('Content-type: application/json; charset=utf-8');
echo $result;
/*?>*/