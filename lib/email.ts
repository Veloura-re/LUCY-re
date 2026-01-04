// Simple email service using Supabase or console log for development
// For production, integrate with Resend, SendGrid, or AWS SES

export async function sendInviteEmail(toEmail: string, inviteUrl: string, schoolName: string, token: string, role: string = 'TEACHER') {
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
        const roleLabel = role === 'PRINCIPAL' ? 'Director' : role.charAt(0) + role.slice(1).toLowerCase();

        const { error } = await resend.emails.send({
            from: 'LUCY Platform <onboarding@resend.dev>',
            to: toEmail,
            subject: `Invitation: Join ${schoolName} as a ${roleLabel}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #101314; background-color: #ffffff; border-radius: 24px; border: 1px solid #f0f0f0;">
                    <div style="margin-bottom: 32px; text-align: center;">
                        <span style="font-size: 40px;">🎓</span>
                        <h1 style="color: #147A52; margin-top: 16px; font-weight: 900; letter-spacing: -0.05em;">LUCY</h1>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: #101314; margin-bottom: 16px;">Institutional Invitation</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4A4E52;">You have been invited to join <strong>${schoolName}</strong> on the LUCY School Management Platform as a <strong>${roleLabel}</strong>.</p>
                    
                    <div style="background-color: #f8faf9; padding: 24px; border-radius: 16px; margin: 32px 0; border: 1px solid #eef2f0;">
                        <p style="margin: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6E7377;">Access Key</p>
                        <p style="margin: 12px 0 0 0; font-family: ui-monospace, monospace; font-size: 28px; font-weight: 800; color: #147A52; letter-spacing: 0.1em;">${token}</p>
                    </div>

                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${inviteUrl}" style="background-color: #147A52; color: #ffffff; padding: 18px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Initialize Account</a>
                    </div>
                    
                    <p style="font-size: 14px; line-height: 1.6; color: #6E7377;">If the button above does not work, copy and paste this URL into your browser:</p>
                    <p style="font-size: 12px; color: #147A52; word-break: break-all;">${inviteUrl}</p>
                    
                    <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 40px 0;" />
                    <p style="font-size: 11px; text-align: center; color: #9EA3A7; text-transform: uppercase; letter-spacing: 0.1em;">LUCY Advanced Academic Infrastructure &copy; 2025</p>
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

export async function sendAssessmentReportEmail(
    toEmail: string,
    studentName: string,
    examTitle: string,
    subjectName: string,
    score: number,
    totalScore: number,
    attendanceStatus: string,
    remark?: string
) {
    const { Resend } = await import('resend');
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ RESEND_API_KEY is missing. Logging assessment report.');
        console.log(`[ASSESSMENT] To: ${toEmail}, Student: ${studentName}, Exam: ${examTitle}, Score: ${score}/${totalScore}, Attendance: ${attendanceStatus}`);
        return { success: true, simulated: true };
    }

    try {
        const resend = new Resend(apiKey);
        const percentage = ((score / totalScore) * 100).toFixed(1);

        await resend.emails.send({
            from: 'LUCY Platform <academic@resend.dev>',
            to: toEmail,
            subject: `Academic Report: ${studentName} - ${examTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #101314; background-color: #ffffff; border-radius: 24px; border: 1px solid #f0f0f0;">
                    <div style="margin-bottom: 32px; text-align: center;">
                        <span style="font-size: 40px;">📋</span>
                        <h1 style="color: #147A52; margin-top: 16px; font-weight: 900; letter-spacing: -0.05em;">LUCY ACADEMIC</h1>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: #101314; margin-bottom: 8px;">Assessment Finalized</h2>
                    <p style="font-size: 14px; font-weight: 600; color: #6E7377; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 0.1em;">Official Performance Statement</p>
                    
                    <div style="background-color: #f8faf9; padding: 32px; border-radius: 20px; border: 1px solid #eef2f0; margin-bottom: 32px;">
                        <div style="margin-bottom: 24px;">
                            <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6E7377;">Student</p>
                            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #101314;">${studentName}</p>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6E7377;">Subject & Context</p>
                            <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #101314;">${subjectName} • ${examTitle}</p>
                        </div>

                        <div style="display: flex; gap: 40px; margin-top: 32px; border-top: 1px solid #eef2f0; pt: 32px;">
                            <div style="flex: 1;">
                                <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6E7377;">Score</p>
                                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 900; color: #147A52;">${score}<span style="font-size: 16px; color: #9EA3A7; font-weight: 600;">/${totalScore}</span></p>
                                <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 800; color: #147A52;">${percentage}%</p>
                            </div>
                            <div style="flex: 1;">
                                <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6E7377;">Attendance</p>
                                <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 800; color: ${attendanceStatus === 'PRESENT' ? '#147A52' : '#D14343'};">${attendanceStatus}</p>
                            </div>
                        </div>
                    </div>

                    ${remark ? `
                    <div style="margin-bottom: 32px;">
                        <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6E7377;">Instructor Remarks</p>
                        <p style="margin: 0; font-size: 14px; font-style: italic; color: #4A4E52; line-height: 1.6;">"${remark}"</p>
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin: 40px 0;">
                        <p style="font-size: 12px; color: #9EA3A7; margin-bottom: 16px;">Log in to the LUCY Family Portal for full history and analysis.</p>
                        <a href="https://lucy.veloura.re/dashboard" style="background-color: #101314; color: #ffffff; padding: 16px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Access Portal</a>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 40px 0;" />
                    <p style="font-size: 11px; text-align: center; color: #9EA3A7; text-transform: uppercase; letter-spacing: 0.1em;">LUCY Advanced Academic Infrastructure &copy; 2025</p>
                </div>
            `
        });

        return { success: true };
    } catch (e: any) {
        console.error('Failed to send assessment email:', e);
        return { success: false, error: e.message };
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
