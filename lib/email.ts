// Simple email service using Supabase or console log for development
// For production, integrate with Resend, SendGrid, or AWS SES

export async function sendInviteEmail(toEmail: string, inviteUrl: string, schoolName: string, token: string) {
    // Use Resend for real emails
    const { Resend } = await import('resend');

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ RESEND_API_KEY is missing. Falling back to console log.');
        logEmail(toEmail, inviteUrl, schoolName, token);
        return { success: false, error: 'Missing API Key', simulated: true };
    }

    try {
        const resend = new Resend(apiKey);

        // Note: 'onboarding@resend.dev' works for testing to your own email.
        // For production, you must verify a domain in Resend dashboard.
        const { error } = await resend.emails.send({
            from: 'LUCY Platform <onboarding@resend.dev>',
            to: toEmail,
            subject: `You've been invited to manage ${schoolName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #101314;">
                    <h1 style="color: #147A52;">Welcome to LUCY</h1>
                    <p>Hello,</p>
                    <p>You have been invited to manage <strong>${schoolName}</strong> on the LUCY School Management Platform.</p>
                    
                    <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #6E7377;">Your Secret Key:</p>
                        <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 24px; font-weight: bold; color: #147A52;">${token}</p>
                    </div>

                    <p>Click the link below to accept your invitation and set up your account:</p>
                    <p><a href="${inviteUrl}" style="color: #147A52; text-decoration: underline;">Accept Invitation</a></p>
                    
                    <p style="font-size: 12px; color: #6E7377; margin-top: 40px;">If you did not expect this invitation, please ignore this email.</p>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error:', error);
            logEmail(toEmail, inviteUrl, schoolName, token);
            return { success: false, error: error.message, simulated: true };
        }

        // Also log for dev convenience
        logEmail(toEmail, inviteUrl, schoolName, token);

        return { success: true };
    } catch (error: any) {
        console.error('Failed to send email:', error);
        logEmail(toEmail, inviteUrl, schoolName, token); // Fallback
        return { success: false, error: error.message || 'Unknown Error', simulated: true };
    }
}

function logEmail(toEmail: string, inviteUrl: string, schoolName: string, token: string) {
    console.log('='.repeat(80));
    console.log('📧 INVITE EMAIL (SIMULATION OR LOG)');
    console.log('='.repeat(80));
    console.log(`To: ${toEmail}`);
    console.log(`School: ${schoolName}`);
    console.log(`Secret Key: ${token}`);
    console.log(`Invite URL: ${inviteUrl}`);
    console.log('='.repeat(80));
}
