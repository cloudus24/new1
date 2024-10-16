const { Payment, Order, Cart } = require("../model/index.model");
const mongoose = require('mongoose');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');

exports.getKey = async (req, res) => {
    try {
        const getKey = process.env.STRIPE_KEY;

        return res.status(200).json({
            status: true,
            key: getKey
        });

    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: "Internal server error!"
        });
    }
};

exports.createStripePayment = async (req, res) => {
    const { cart, address, userId } = req.body;

    if (!cart || !address || !userId || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
            status: false,
            message: "Invalid data fields!"
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'cash', 'bank_transfer'],
            line_items: cart.items.map(item => ({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.productName,
                    },
                    unit_amount: item.productPrice * 100,
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/order/success`,
            cancel_url: `${process.env.FRONTEND_URL}/order/cancel`,
        });

        const payment = new Payment({
            userId: userId,
            paymentMethod: 'card',
            paymentId: stripeSession.id,
            amount: cart.items.reduce((total, item) =>
                total + item.productPrice * item.quantity, 0
            ),
            currency: 'inr',
        });

        await payment.save({ session });

        const orders = await Promise.all(
            cart.items.map(async (item) => {
                const order = new Order({
                    userId: userId,
                    productId: item.productId,
                    quantity: item.quantity,
                    totalPrice: item.productPrice * item.quantity,
                    paymentMethod: '',
                    address: address,
                });

                await order.save({ session });

                await Cart.findByIdAndDelete(item._id, { session });

                return order;
            })
        );

        await session.commitTransaction();

        res.status(201).json({
            status: true,
            message: "Payment session created and orders processed successfully",
            sessionId: stripeSession.id,
            payment,
            orders
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating payment session and orders:', error.message);
        res.status(500).send('Error creating payment session');
    } finally {
        session.endSession();
        console.log('Session ended');
    }
};


const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);

const client = new paypal.core.PayPalHttpClient(environment);

exports.createPayPalPayment = async (req, res) => {
    const { cart, address, userId } = req.body;

    if (!cart || !address || !userId || !cart.items || cart.items.length === 0) {
        return res.status(400).json({ status: false, message: "Invalid data fields!" });
    }

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        return res.status(500).json({ status: false, message: "PayPal credentials not found!" });
    }


    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: cart.items.map((item, index) => ({
                reference_id: `item-${index}`,
                amount: {
                    currency_code: 'USD',
                    value: (item.productPrice * item.quantity).toFixed(2),
                },
                description: item.productName,
            })),
            application_context: {
                shipping_preference: 'NO_SHIPPING',
                return_url: `http://localhost:3002/order/success`,
                cancel_url: `http://localhost:3002/order/cancel`,
            },
        });

        const paypalOrder = await client.execute(request);

        const approvalUrl = paypalOrder.result.links.find(link => link.rel === 'approve').href;

        const payment = new Payment({
            userId: userId,
            paymentMethod: 'online',
            paymentId: paypalOrder.result.id,
            amount: cart.items.reduce((total, item) => total + item.productPrice * item.quantity, 0),
            currency: 'USD',
        });

        await payment.save({ session });

        const orders = await Promise.all(
            cart.items.map(async (item) => {
                const order = new Order({
                    userId: userId,
                    productId: item.productId,
                    quantity: item.quantity,
                    totalPrice: item.productPrice * item.quantity,
                    paymentMethod: 'paypal',
                    address: address,
                });

                await order.save({ session });

                await Cart.findByIdAndDelete(item._id, { session });

                return order;
            })
        );

        await session.commitTransaction();

        res.status(201).json({
            status: true,
            message: "PayPal order created and orders processed successfully",
            orderID: paypalOrder.result.id,
            payment,
            orders,
            approvalUrl: approvalUrl
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating PayPal order and processing orders:', error.message);
        res.status(500).send('Error creating PayPal order');
    } finally {
        session.endSession();
        console.log('Session ended');
    }
};


exports.verifyPayPalPayment = async (req, res) => {
    const { orderID, payerID } = req.query;

    console.log('req.query :>> ', req.query);

    if (!orderID || !payerID) {
        return res.status(400).json({ status: false, message: "Missing required parameters" });
    }

    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const captureResponse = await client.execute(request);

        if (captureResponse.result.status === 'COMPLETED') {

            const payment = await Payment.findOne({ paymentId: orderID });
            if (payment) {
                payment.status = 'completed';
                await payment.save();
            }


            const orders = await Order.find({ paymentId: orderID });
            if (orders.length > 0) {
                for (const order of orders) {
                    order.status = 'completed';
                    await order.save();
                }
            }

            res.status(200).json({
                status: true,
                message: "Payment verified successfully",
                captureResponse: captureResponse.result
            });
        } else {
            res.status(400).json({
                status: false,
                message: "Payment was not completed"
            });
        }

    } catch (error) {
        console.error('Error verifying PayPal payment:', error.message);
        res.status(500).send('Error verifying PayPal payment');
    }
};

exports.checkPayPalPaymentStatus = async (req, res) => {
    const { orderID } = req.query;

    if (!orderID) {
        return res.status(400).json({ status: false, message: "Missing required order ID" });
    }

    try {
        const request = new paypal.orders.OrdersGetRequest(orderID);
        const captureResponse = await client.execute(request);

        const paymentStatus = captureResponse.result.status;

        if (paymentStatus === 'COMPLETED') {
            const payment = await Payment.findOne({ paymentId: orderID });
            if (payment && payment.status !== 'completed') {
                payment.status = 'completed';
                await payment.save();

                const orders = await Order.find({ paymentId: orderID });
                if (orders.length > 0) {
                    for (const order of orders) {
                        order.status = 'completed';
                        await order.save();
                    }
                }
            }

            res.status(200).json({
                status: true,
                message: "Payment completed successfully",
                returnUrl: `http://localhost:3000/order/success?orderID=${orderID}`
            });
        } else if (paymentStatus === 'PAYER_ACTION_REQUIRED') {
            res.status(200).json({
                status: false,
                message: "Payment requires further action",
                returnUrl: captureResponse.result.links.find(link => link.rel === 'approve').href
            });
        } else {
            res.status(400).json({
                status: false,
                message: "Payment was not completed"
            });
        }
    } catch (error) {
        console.error('Error checking PayPal payment status:', error.message);
        res.status(500).send('Error checking PayPal payment status');
    }
};

//amazon pay payment gateway
exports.createAmazonPayPayment = async (req, res) => {
    const { cart, address, userId } = req.body;

    if (!cart || !address || !userId || !cart.items || cart.items.length === 0) {
        return res.status(400).json({ status: false, message: "Invalid data fields!" });
    }

    if (!process.env.AMAZON_PAY_CLIENT_ID || !process.env.AMAZON_PAY_SECRET) {
        return res.status(500).json({ status: false, message: "Amazon Pay credentials not found!" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const amount = cart.items.reduce((total, item) => total + item.productPrice * item.quantity, 0).toFixed(2);
        const currency = 'USD';
        const checkoutSessionPayload = {
            merchantId: process.env.AMAZON_PAY_MERCHANT_ID,
            paymentDetails: {
                amount: {
                    currencyCode: currency,
                    value: amount,
                },
                itemDetails: cart.items.map((item, index) => ({
                    productId: item.productId,
                    name: item.productName,
                    quantity: item.quantity,
                    price: item.productPrice.toFixed(2),
                })),
            },
            applicationContext: {
                shippingPreference: 'NO_SHIPPING',
                returnUrl: `http://localhost:3002/order/success`,
                cancelUrl: `http://localhost:3002/order/cancel`,
            },
        };

        const response = await axios.post('https://pay-api.amazon.com/sandbox/checkout/session', checkoutSessionPayload, {
            headers: {
                'x-amz-pay-id': process.env.AMAZON_PAY_CLIENT_ID,
                'Content-Type': 'application/json',
            },
        });

        const amazonOrderId = response.data.orderId;

        const payment = new Payment({
            userId: userId,
            paymentMethod: 'online',
            paymentId: amazonOrderId,
            amount: amount,
            currency: currency,
        });

        await payment.save({ session });

        const orders = await Promise.all(
            cart.items.map(async (item) => {
                const order = new Order({
                    userId: userId,
                    productId: item.productId,
                    quantity: item.quantity,
                    totalPrice: item.productPrice * item.quantity,
                    paymentMethod: 'amazon',
                    address: address,
                });

                await order.save({ session });

                await Cart.findByIdAndDelete(item._id, { session });

                return order;
            })
        );

        await session.commitTransaction();

        res.status(201).json({
            status: true,
            message: "Amazon Pay order created and orders processed successfully",
            orderID: amazonOrderId,
            payment,
            orders,
            approvalUrl: response.data.approvalUrl, 
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating Amazon Pay order and processing orders:', error.message);
        res.status(500).send('Error creating Amazon Pay order');
    } finally {
        session.endSession();
        console.log('Session ended');
    }
};