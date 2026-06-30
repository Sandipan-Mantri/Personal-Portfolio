// ═══════════════════════════════════════════════════════════════════
//  PORTFOLIO CONTACT FORM — GOOGLE APPS SCRIPT BACKEND
//  Sends email to your iCloud + optional SMS to your phone.
//  Uses YOUR Google account — no new account needed.
//
//  HOW TO DEPLOY (one time, ~4 minutes):
//  ─────────────────────────────────────────────────────────────────
//  1. Open https://script.google.com  (you are already logged in)
//  2. Click  "+ New project"
//  3. Delete all code in the editor, paste everything from this file
//  4. Click the Save icon  (Ctrl+S)
//  5. Click  "Deploy"  →  "New deployment"
//  6. Click the gear ⚙ next to "Type"  →  select  "Web app"
//  7. Set:  Execute as  = Me
//           Who has access  = Anyone
//  8. Click  "Deploy"
//  9. Click  "Authorize access"  →  pick your Google account
//     →  click "Advanced"  →  "Go to ... (unsafe)"  →  "Allow"
// 10. Copy the  Web app URL  (starts with https://script.google.com/macros/s/)
// 11. Open  main.js  and paste that URL as the value of  GAS_ENDPOINT
// ═══════════════════════════════════════════════════════════════════

// ── CONFIG (already filled in — no changes needed here) ────────────
var RECIPIENT_EMAIL = 'mantrisandipan@icloud.com';
var MY_PHONE        = '7797711005';

// OPTIONAL SMS: get a free API key at https://www.fast2sms.com
// Dashboard → Dev API → copy the key → paste it below
var FAST2SMS_KEY    = 'YOUR_FAST2SMS_KEY';
// ───────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var name    = (e.parameter.name    || '').toString().trim();
    var email   = (e.parameter.email   || '').toString().trim();
    var subject = (e.parameter.subject || 'No Subject').toString().trim();
    var message = (e.parameter.message || '').toString().trim();

    if (!name || !email || !message) {
      return jsonResponse({ success: false, error: 'Missing fields.' });
    }

    // 1. Send styled HTML email via Gmail
    MailApp.sendEmail({
      to:       RECIPIENT_EMAIL,
      subject:  'Portfolio Contact: ' + subject,
      replyTo:  email,
      name:     'Portfolio Contact Form',
      htmlBody: buildEmailHTML(name, email, subject, message)
    });

    // 2. Send SMS via Fast2SMS (only if key is configured)
    if (FAST2SMS_KEY && FAST2SMS_KEY !== 'YOUR_FAST2SMS_KEY') {
      var smsText =
        'Portfolio Contact!\n' +
        'From: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Subject: ' + subject;

      UrlFetchApp.fetch(
        'https://www.fast2sms.com/dev/bulkV2' +
        '?authorization=' + encodeURIComponent(FAST2SMS_KEY) +
        '&route=q' +
        '&message=' + encodeURIComponent(smsText) +
        '&flash=0' +
        '&numbers=' + MY_PHONE,
        { muteHttpExceptions: true }
      );
    }

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function buildEmailHTML(name, email, subject, message) {
  var msg = message
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/\n/g,'<br>');

  return '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;background:#0f0f1a;border-radius:12px;overflow:hidden;border:1px solid #2d2d4e;">' +
    '<div style="background:linear-gradient(135deg,#00f2fe,#a855f7);padding:28px 32px;">' +
      '<h2 style="margin:0;color:#fff;font-size:22px;">New Portfolio Contact</h2>' +
      '<p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Someone reached out via your portfolio</p>' +
    '</div>' +
    '<div style="padding:28px 32px;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<tr><td style="padding:10px;color:#8b8ba7;font-size:12px;text-transform:uppercase;width:90px;">Name</td>' +
            '<td style="padding:10px;color:#e2e8f0;font-size:15px;">' + name + '</td></tr>' +
        '<tr style="background:rgba(255,255,255,0.03);">' +
            '<td style="padding:10px;color:#8b8ba7;font-size:12px;text-transform:uppercase;">Email</td>' +
            '<td style="padding:10px;"><a href="mailto:' + email + '" style="color:#00f2fe;">' + email + '</a></td></tr>' +
        '<tr><td style="padding:10px;color:#8b8ba7;font-size:12px;text-transform:uppercase;">Subject</td>' +
            '<td style="padding:10px;color:#e2e8f0;">' + subject + '</td></tr>' +
      '</table>' +
      '<div style="margin-top:20px;padding:20px;background:rgba(255,255,255,0.04);border-left:3px solid #a855f7;border-radius:4px;">' +
        '<p style="margin:0 0 6px;color:#8b8ba7;font-size:11px;text-transform:uppercase;">Message</p>' +
        '<p style="margin:0;color:#cbd5e1;line-height:1.7;">' + msg + '</p>' +
      '</div>' +
      '<div style="margin-top:24px;">' +
        '<a href="mailto:' + email + '?subject=Re: ' + subject + '" ' +
           'style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#00f2fe,#a855f7);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">' +
          'Reply to ' + name +
        '</a>' +
      '</div>' +
    '</div>' +
    '<div style="padding:16px 32px;border-top:1px solid #2d2d4e;">' +
      '<p style="margin:0;color:#4a4a6a;font-size:12px;">Sent via your Portfolio contact form</p>' +
    '</div>' +
  '</div>';
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
