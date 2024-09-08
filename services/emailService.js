const nodemailer = require('nodemailer');
require('dotenv').config();
const { generateSignedUrls } = require('./googleCloudStorage'); // Use generateSignedUrls for multiple URLs
//const sharp = require('sharp');  // Add sharp library for resizing images

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Your Gmail address stored in .env
        pass: process.env.GMAIL_PASS // Your Gmail app password stored in .env
    }
});
/*
async function resizeImage(url) {
    try {
        // Download the image, resize it to a smaller size using sharp
        const response = await fetch(url);
        const buffer = await response.buffer();

        // Resize the image to a smaller width (e.g., 200px) while maintaining the aspect ratio
        const resizedBuffer = await sharp(buffer)
            .resize({ width: 200 }) // Adjust width as needed
            .toBuffer();

        // Return the resized image as a base64-encoded string
        return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    } catch (error) {
        console.error('Failed to resize image:', error);
        throw error;
    }
}
*///sendMatchNotification(ownerDetails, pet.photos.map(photo => photo.filename), matchedPet, petFounder.owner, petLocation);

async function sendMatchNotification(ownerDetails, photoFilenames, matchedPet, petFounder, petLocation) {
    try {
        // Generate signed URLs for all photos stored in Google Cloud Storage
        const photoUrls = await generateSignedUrls(photoFilenames);

        // Generate HTML content for each photo
        const photosHtml = photoUrls.map(url => `
            <p style="text-align: center;">
                <img src="${url}" alt="Possible match for ${matchedPet.name}" style="max-width: 100%; height: auto; border-radius: 8px;"/>
            </p>
        `).join('');

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: ownerDetails.email,
            subject: `We've Found a Possible Match for Your Lost Pet: ${matchedPet.name}`,
            html: `
                <p>Dear ${ownerDetails.name},</p>
                <p>We are excited to inform you that we've found a potential match for your lost pet, <strong>${matchedPet.name}</strong>!</p>
                <p>Take a look at the photos below and see if this could be your beloved pet:</p>
                ${photosHtml}
                <p>If you believe this is your pet, please reach out to us or visit our platform for more details.</p>
                <p>Founder Details of Possible Match:</p>
                <ul>
                    <li><strong>Founder's Name:</strong> ${petFounder.firstName} ${petFounder.lastName}</li>
                    <li><strong>Email:</strong> ${petFounder.email}</li>
                    <li><strong>Phone Number:</strong> ${petFounder.phone}</li>
                    <li><strong>Pet Last Seen:</strong> ${petLocation}</li>
                </ul>
                <p>Wishing you a happy reunion soon!</p>
                <p>Best regards,<br/>The Pet Finder Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${ownerDetails.email} for pet: ${matchedPet.name}`);
    } catch (error) {
        console.error(`Failed to send email to ${ownerDetails.email}:`, error);
        throw error;  // Rethrow to handle in the calling function
    }
}

module.exports = { sendMatchNotification };
