const SMSLog = require('../models/SMSLog');

async function sendSMS(phone, message, trigger, recipientId) {
  const log = new SMSLog({ 
    phone, message, trigger, recipientId,
    provider: process.env.SMS_PROVIDER || 'twilio',
    status: 'pending'
  });

  try {
    if (process.env.SMS_PROVIDER === 'fast2sms') {
      await sendFast2SMS(phone, message);
    } else {
      await sendTwilio(phone, message);
    }
    log.status = 'sent';
    await log.save();
    return { success: true, logId: log._id };
  } catch (error) {
    log.status = 'failed';
    log.error = error.message;
    await log.save();
    console.error('SMS failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendTwilio(phone, message) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone.startsWith('+') ? phone : `+91${phone}`
  });
}

async function sendFast2SMS(phone, message) {
  const axios = require('axios');
  await axios.post('https://www.fast2sms.com/dev/bulkV2', {
    route: 'q',
    message,
    language: 'english',
    flash: 0,
    numbers: phone
  }, {
    headers: { authorization: process.env.FAST2SMS_API_KEY }
  });
}

async function sendHighRiskAlert(mother) {
  const message = `🚨 Sheon Alert: ${mother.name}'s maternal risk level is HIGH. Immediate medical attention required. Please contact your doctor or visit the nearest hospital. Helpline: 1800-XXX-XXXX`;
  return sendSMS(mother.phone, message, 'high-risk', mother._id);
}

async function sendNurseAssignedAlert(mother, nurseName, visitDate) {
  const message = `💜 Sheon: Nurse ${nurseName} has been assigned to visit you on ${new Date(visitDate).toLocaleDateString('en-IN')}. She will contact you shortly. Stay safe!`;
  return sendSMS(mother.phone, message, 'nurse-assigned', mother._id);
}

async function sendEmergencyEscalation(mother, hospital) {
  const message = `🔴 EMERGENCY: Sheon has escalated your case to ${hospital || 'nearest hospital'}. Please prepare to travel immediately. Your doctor has been notified.`;
  return sendSMS(mother.phone, message, 'emergency', mother._id);
}

async function sendLabReminder(mother, testName, dueDate) {
  const message = `🔬 Sheon Reminder: Your ${testName} test is due on ${new Date(dueDate).toLocaleDateString('en-IN')}. Please visit your nearest diagnostic center.`;
  return sendSMS(mother.phone, message, 'lab-reminder', mother._id);
}

async function sendDoctorAssignedAlert(mother, doctorName) {
  const message = `💜 Sheon: Dr. ${doctorName} has been assigned as your primary doctor. You can now chat with them in the app.`;
  return sendSMS(mother.phone, message, 'doctor-assigned', mother._id);
}

async function sendDoctorUrgentReply(mother, doctorName) {
  const message = `⚕️ Sheon: Dr. ${doctorName} has sent you an urgent message. Please check your app immediately or call your clinic.`;
  return sendSMS(mother.phone, message, 'doctor-urgent', mother._id);
}

module.exports = { sendSMS, sendHighRiskAlert, sendNurseAssignedAlert, sendEmergencyEscalation, sendLabReminder, sendDoctorAssignedAlert, sendDoctorUrgentReply };
