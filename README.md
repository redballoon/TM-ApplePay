# TM-ApplePay
A light robust javascript wrapper for the Apple Pay for Web API. Includes a partial end to end example (frontend and backend) for getting started with Apple Pay.


*Still under development but any feedback is appreciated. Jsdoc and additional 'getting started' and certificate info will be added soon*

## Why
I found that the available online resources for implementing Apple Pay for Web without using modern payment provider libraries (e.g Paypal, Stripe, Braintree) to be extremely lacking. There was also a lack of information regarding Backend implementation and how to
successfully create a merchant session.


## Dependencies
* jQuery
* a valid Merchant ID from Apple's developer portal


## What's available
* a PHP snippet to get you up and running with handling post requests and creating the Merchant Session. This is basically a Stub file to simulate the behavior and be of temporary substitute for your yet-to-be-developed code.

* wrapper includes build in functionality to track the running total and line items using a custom option. This makes it easier to
update the payment sheet as you only have to call setter methods to update things like tax, shipping, and discounts.

* wrapper handles messy try/catch blocks on native methods so that your code looks cleaner and errors become more descriptive in
some cases.



## Getting Started

#### Merchant ID

#### Domain Validation

#### Merchant Session

*Certificates*

#### Payment Processor

## Usage


## Methods
## Events
todo: add table
-------------------
event name  | Notes: will NOTE be triggered...
			| Description:
--------------
