const LOG_DEBUG = true
import MailTemple from "./services.email.js";



export const sendUserTaxSubmissionEmail = (data) => {
    new MailTemple(data.email).who(data.name)
        .body(
            "<strong>Thank you for submitting your tax return!</strong><br/><br/>" +
            "<p>We have successfully received your tax return submission and our team is currently reviewing it. We will notify you once the review process is complete.</p><br/>" +
            "<p>Here's what you can expect next:</p><br/>" +
            "<strong>Review Process:</strong> Our team will carefully review your submission to ensure all details are accurate and complete.<br/>" +
            "<strong>Notification:</strong> You will receive an email notification once the review is complete.<br/>" +
            "<strong>Further Steps:</strong> If additional information is required, we will reach out to you directly.<br/><br/>" +
            "<p>If you have any questions or need further assistance, feel free to contact us. Our team is here to help!</p><br/>" +
            "<p>Thank you for trusting us with your tax return submission.</p><br/>" 
        )
        .subject("Tax Return Submission Received").send().then(r => LOG_DEBUG ? console.log(r) : null);
};

export const sendAdminTaxSubmissionNotification = (data) => {
    new MailTemple(data.adminEmail).who("Admin")
        .body(
            "<strong>A new tax return submission has been received!</strong><br/><br/>" +
            "<p>Here are the details of the submission:</p><br/>" +
            "<strong>User Name:</strong> " + data.name + "<br/>" +
            "<strong>User Email:</strong> " + data.email + "<br/>" +
            "<strong>Submission Date:</strong> " + new Date().toLocaleDateString() + "<br/><br/>" +
            "<p>Please review the submission at your earliest convenience and take the necessary next steps.</p><br/>"
        )
        .subject("New Tax Return Submission Received").send().then(r => LOG_DEBUG ? console.log(r) : null);
};


export const sendTaxSubmissionApprovedEmail = (data) => {
    new MailTemple(data.email).who(data.name)
        .body(
            "<strong>Great news! Your tax return submission has been approved.</strong><br/><br/>" +
            "<p>We are pleased to inform you that your tax return submission has been successfully reviewed and approved. Thank you for providing all the necessary details and documentation.</p><br/>" +
            "<p>Here are the next steps:</p><br/>" +
            "<strong>Confirmation:</strong> Your tax return is now finalized and processed.<br/>" +
            "<strong>Documentation:</strong> You can download your tax return summary and related documents from your account.<br/>" +
            "<strong>Support:</strong> If you have any questions or need further assistance, feel free to contact us.<br/><br/>" +
            "<p>Thank you for choosing us to handle your tax return. We appreciate your trust and look forward to assisting you in the future.</p><br/>" 
        )
        .subject("Tax Return Submission Approved").send().then(r => LOG_DEBUG ? console.log(r) : null);
};

export const sendTaxSubmissionDeclinedEmail = (data) => {
    new MailTemple(data.email).who(data.name)
        .body(
            "<strong>We regret to inform you that your tax return submission has been declined.</strong><br/><br/>" +
            "<p>After reviewing your submission, we found some issues that need to be addressed. Please review your submission and resubmit your tax return with the necessary corrections.</p><br/>" +
            "<p>Here's what you need to do next:</p><br/>" +
            "<strong>Review:</strong> Carefully review your submission and make the necessary corrections.<br/>" +
            "<strong>Resubmit:</strong> Log in to your account and resubmit your tax return with the updated information.<br/>" +
            "<strong>Support:</strong> If you need assistance, feel free to contact us. We're here to help!<br/><br/>" +
            "<p>We apologize for any inconvenience this may cause and appreciate your understanding.</p><br/>" 
        )
        .subject("Tax Return Submission Declined").send().then(r => LOG_DEBUG ? console.log(r) : null);
};