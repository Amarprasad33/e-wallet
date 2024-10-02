import express from 'express';
import db from '@repo/db/client'

const app = express();


app.post("/hdfcWebhook", async (req, res) => {
    // TODO: Add zod validation here
    // Check if this request actually came from hdfc back, use a webhook secret here
    const paymentInformation = {
        token: req.body.token,
        userId: req.body.user_identifier,
        amount: req.body.amount
    }
    try {
        // Update balance in database, add transaction
        await db.$transaction([
            db.balance.update({
                where: {
                    userId: paymentInformation.userId
                },
                data: {
                    amount: {
                        increment: paymentInformation.amount
                    }
                }
            }),
            // Adding the trns. in onRampTransactions
            db.onRampTransaction.update({
                where: {
                    token: paymentInformation.token
                },
                data: {
                    status: "Success"
                }
            })
        ]);
        res.status(200).json({
            message: "captured"
        })
    } catch (error) {
         // successfully captured req.
        res.status(411).json({
            message: "failed"
        })
        db.onRampTransaction.update({
            where: {
                token: paymentInformation.token
            },
            data: {
                status: "Failure"
            }
        })
    }
})

