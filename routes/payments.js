"use strict";

/** Routes for adding/modifying playlists **/

const express = require("express");
const { BadRequestError } = require("../expressError");
const router = new express.Router();
const braintree = require('braintree');

router.post('/', (req, res, next) => {
    const gateway = new braintree.BraintreeGateway({
      environment: braintree.Environment.Sandbox,
      // Use your own credentials from the sandbox Control Panel here
      merchantId: 'k9tt6cnqf2c77qj3',
      publicKey: 'd5xvr9h2wy7ncrst',
      privateKey: '5f61d538be480aba9e04475aebd1487f'
    });
  
    // Use the payment method nonce here
    const nonceFromTheClient = req.body.paymentMethodNonce;
    console.log(`The nonce is ${nonceFromTheClient}`);
    // Create a new transaction for $10
    const newTransaction = gateway.transaction.sale({
      amount: '10.00',
      paymentMethodNonce: nonceFromTheClient,
      options: {
        // This option requests the funds from the transaction
        // once it has been authorized successfully
        submitForSettlement: true
      }
    }, (error, result) => {
        if (result) {
          res.send(result);
        } else {
          res.status(500).send(error);
        }
    });
  });
  
  module.exports = router;