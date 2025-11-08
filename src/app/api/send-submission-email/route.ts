import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const {
      companyName,
      contactEmail,
      issuerAddress,
      walletType,
      bondSymbol,
      tokenName,
      tokenId,
      principalTarget,
      currency,
      format,
      startDate,
      endDate,
      durationYears,
      couponRate,
      couponFrequencyMonths,
      totalRepayment,
      minTicket,
      kycRequired,
    } = data

    // Format the email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #666; }
    .value { color: #000; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Bond Submission Received</h1>
    </div>
    <div class="content">
      <p>Dear ${companyName},</p>
      <p>Thank you for submitting your bond offering. Here is a summary of your submission:</p>
      
      <div class="section">
        <h3>Company Information</h3>
        <p><span class="label">Company Name:</span> <span class="value">${companyName}</span></p>
        <p><span class="label">Contact Email:</span> <span class="value">${contactEmail}</span></p>
        <p><span class="label">Issuer XRPL Address:</span> <span class="value">${issuerAddress}</span></p>
        <p><span class="label">Wallet Type:</span> <span class="value">${walletType}</span></p>
      </div>
      
      <div class="section">
        <h3>Bond Details</h3>
        <p><span class="label">Bond Code:</span> <span class="value">${bondSymbol}</span></p>
        <p><span class="label">Token Name:</span> <span class="value">${tokenName}</span></p>
        <p><span class="label">Token ID:</span> <span class="value">${tokenId}</span></p>
        <p><span class="label">Format:</span> <span class="value">${format}</span></p>
        <p><span class="label">Target:</span> <span class="value">${principalTarget} ${currency}</span></p>
      </div>
      
      <div class="section">
        <h3>Bond Timeline</h3>
        <p><span class="label">Start Date:</span> <span class="value">${new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
        <p><span class="label">End Date:</span> <span class="value">${new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
        <p><span class="label">Duration:</span> <span class="value">${durationYears} year${durationYears !== 1 ? 's' : ''}</span></p>
      </div>
      
      ${format === 'CLASSIC' ? `
      <div class="section">
        <h3>Coupon Information</h3>
        <p><span class="label">Coupon Rate:</span> <span class="value">${couponRate}% per year</span></p>
        <p><span class="label">Payment Frequency:</span> <span class="value">${
          couponFrequencyMonths === 1 ? 'Monthly' :
          couponFrequencyMonths === 3 ? 'Quarterly' :
          couponFrequencyMonths === 6 ? 'Semi-Annual' : 'Annual'
        }</span></p>
        <p><span class="label">Total Repayment:</span> <span class="value">${totalRepayment} ${currency}</span></p>
      </div>
      ` : `
      <div class="section">
        <h3>Zero-Coupon Bond</h3>
        <p><span class="label">Total Repayment at Maturity:</span> <span class="value">${totalRepayment} ${currency}</span></p>
      </div>
      `}
      
      <div class="section">
        <h3>Investment Terms</h3>
        ${minTicket ? `<p><span class="label">Minimum Ticket:</span> <span class="value">${minTicket} ${currency}</span></p>` : '<p><span class="label">Minimum Ticket:</span> <span class="value">No minimum</span></p>'}
        <p><span class="label">KYC Required:</span> <span class="value">${kycRequired ? 'Yes' : 'No'}</span></p>
        <p class="text-xs" style="color: #666; font-style: italic; margin-top: 8px;">
          Note: The pool will automatically lock once it reaches the principal target amount, and funds will be sent to the issuer.
        </p>
      </div>
      
      <div class="section">
        <h3>What happens next?</h3>
        <ol>
          <li>Our team will review your submission</li>
          <li>We'll contact you at ${contactEmail}</li>
          <li>Once approved, your bond will be listed</li>
          <li>You'll receive instructions for token issuance</li>
        </ol>
      </div>
    </div>
    <div class="footer">
      <p>XRPL Corporate Bonds - Powered by XRPL</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Send email using Resend
    // In test mode, Resend only allows sending to the verified email address
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
    const testModeEmail = 'sofiane.ben_taleb@edu.devinci.fr' // Your verified email
    const toEmail = process.env.NODE_ENV === 'production' ? contactEmail : testModeEmail
    
    console.log('📧 Sending email to:', toEmail, process.env.NODE_ENV === 'production' ? '(production)' : '(test mode - using verified email)')
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Bond Submission Confirmation - ${bondSymbol}`,
      html: emailContent,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json(
        { success: false, message: 'Failed to send email', error: emailError },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully:', emailData)

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully' 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    )
  }
}
