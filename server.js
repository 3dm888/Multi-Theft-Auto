const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

const twilioClient = twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');
const verificationCodes = {};

app.post('/send-verification-code', (req, res) => {
    const { contact } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000);
    verificationCodes[contact] = code;

    if (contact.includes('@')) {
        transporter.sendMail({
            to: contact,
            subject: 'كود التحقق',
            text: `كود التحقق الخاص بك هو: ${code}`
        }, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'فشل إرسال البريد الإلكتروني.' });
            }
            res.json({ success: true });
        });
    } else {
        twilioClient.messages.create({
            body: `كود التحقق الخاص بك هو: ${code}`,
            to: contact,
            from: 'YOUR_TWILIO_PHONE_NUMBER'
        }).then(message => {
            res.json({ success: true });
        }).catch(error => {
            console.error('Error sending SMS:', error);
            res.status(500).json({ success: false, message: 'فشل إرسال الرسالة القصيرة.' });
        });
    }
});

app.post('/verify-code', (req, res) => {
    const { code, contact } = req.body;
    if (verificationCodes[contact] === code) {
        delete verificationCodes[contact];
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'كود التحقق غير صحيح.' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
