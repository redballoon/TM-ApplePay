<?php
///////////////////////////////
// configuration example
///////////////////////////////
define('MERCHANT_IDENTIFIER', 'your.merchant.id');
define('CERTIFICATE_PATH', '/path/to/your/certificate.pem');


////////////////
// curl_handler -
// add a function to handle the curl request
////////////////
function curl_handler($url, $options = false, $bypass = false) {
	return array();
}
/*?>*/