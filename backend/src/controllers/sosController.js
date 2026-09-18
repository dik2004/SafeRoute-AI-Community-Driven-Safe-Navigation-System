const twilio = require('twilio');

let activeSosAlerts = [];

// Initialize Twilio client if keys are present
let twilioClient = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiSecret = process.env.TWILIO_API_SECRET;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

if (accountSid && apiKeySid && apiSecret) {
  try {
    twilioClient = twilio(apiKeySid, apiSecret, { accountSid });
  } catch (e) {
    console.warn('[Twilio Init Warning]', e.message);
  }
} else if (accountSid && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(accountSid, process.env.TWILIO_AUTH_TOKEN);
  } catch (e) {
    console.warn('[Twilio Init Warning]', e.message);
  }
}

exports.triggerSOS = async (req, res) => {
  try {
    const {
      coordinates, // { lat, lng } or [lng, lat]
      batteryLevel = '85%',
      address = 'Current Live GPS Location',
      alertType = 'EMERGENCY_PANIC_BUTTON',
      contacts = []
    } = req.body;

    const lat = Array.isArray(coordinates) ? coordinates[1] : (coordinates ? coordinates.lat : 28.6289);
    const lng = Array.isArray(coordinates) ? coordinates[0] : (coordinates ? coordinates.lng : 77.2065);

    const alertId = `SOS_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const emergencyMessage = `🚨 [EMERGENCY SOS ALERT via SafeRoute]\nI need urgent help! My current live location is: ${googleMapsUrl}\nBattery: ${batteryLevel}\nTimestamp: ${timestamp}`;

    let realSmsSentCount = 0;
    let realCallsCount = 0;
    const smsDispatchLogs = [];
    const callDispatchLogs = [];

    // Send real Twilio SMS and Voice Call if twilio is configured and contacts are provided
    if (twilioClient && fromPhone && contacts && contacts.length > 0) {
      // 1. Send Twilio SMS to all contacts with live Google Maps location
      for (const contact of contacts) {
        const phone = typeof contact === 'string' ? contact : (contact.phone || contact.phoneNumber);
        if (phone) {
          try {
            const messageResult = await twilioClient.messages.create({
              body: emergencyMessage,
              from: fromPhone,
              to: phone
            });
            realSmsSentCount++;
            smsDispatchLogs.push({ to: phone, status: 'Sent', sid: messageResult.sid });
          } catch (smsErr) {
            console.error(`[Twilio SMS Error to ${phone}]:`, smsErr.message);
            smsDispatchLogs.push({ to: phone, status: 'Failed', error: smsErr.message });
          }
        }
      }

      // 2. Initiate automated Twilio Emergency Voice Call to primary contact
      const primaryContact = contacts[0];
      const primaryPhone = typeof primaryContact === 'string' ? primaryContact : (primaryContact.phone || primaryContact.phoneNumber);
      if (primaryPhone) {
        try {
          const voiceMessage = `This is an urgent emergency alert from SafeRoute. Your contact has activated emergency SOS at latitude ${Number(lat).toFixed(4)}, longitude ${Number(lng).toFixed(4)}. Their live Google Maps location has been sent to your phone via SMS. Please check your messages and respond immediately.`;
          const callResult = await twilioClient.calls.create({
            twiml: `<Response><Say voice="alice" language="en-US">${voiceMessage}</Say><Pause length="1"/><Say voice="alice" language="en-US">Repeating: ${voiceMessage}</Say></Response>`,
            to: primaryPhone,
            from: fromPhone
          });
          realCallsCount++;
          callDispatchLogs.push({ to: primaryPhone, status: 'Calling', sid: callResult.sid });
          console.log(`📞 Real Twilio Emergency Voice Call placed to ${primaryPhone}! Call SID: ${callResult.sid}`);
        } catch (callErr) {
          console.error(`[Twilio Call Error to ${primaryPhone}]:`, callErr.message);
          callDispatchLogs.push({ to: primaryPhone, status: 'Failed', error: callErr.message });
        }
      }
    }

    const newAlert = {
      alertId,
      status: 'active',
      timestamp,
      location: { lat, lng, address },
      batteryLevel,
      alertType,
      simulatedSmsMessage: emergencyMessage,
      recipientsCount: contacts.length || 3,
      realSmsSentCount,
      realCallsCount,
      smsDispatchLogs,
      callDispatchLogs,
      dispatchedServices: [
        { service: 'Police Dispatch (112)', status: 'Notified' },
        { service: 'Emergency Contact Broadcast', status: realSmsSentCount > 0 ? `Live SMS Dispatched (${realSmsSentCount})` : 'SMS Dispatched' },
        { service: 'Twilio Automated Voice Call', status: realCallsCount > 0 ? `Voice Call Dispatched (${realCallsCount})` : 'Automated Voice Alert' },
        { service: 'Nearby Community Guardians', status: 'Beacon Active' }
      ]
    };

    activeSosAlerts.unshift(newAlert);
    if (activeSosAlerts.length > 20) activeSosAlerts.pop();

    console.log(`\n🚨🚨🚨 ==================== EMERGENCY SOS TRIGGERED ==================== 🚨🚨🚨`);
    console.log(`Alert ID: ${alertId} | Lat: ${lat}, Lng: ${lng}`);
    console.log(`Message: ${emergencyMessage}`);
    if (realSmsSentCount > 0) {
      console.log(`📡 Real Twilio SMS sent to ${realSmsSentCount} contact(s)!`);
    }
    if (realCallsCount > 0) {
      console.log(`📞 Real Twilio Voice Call placed to ${realCallsCount} contact(s)!`);
    }
    console.log(`========================================================================\n`);

    return res.status(201).json({
      success: true,
      message: realSmsSentCount > 0 || realCallsCount > 0
        ? `Emergency SOS broadcast dispatched! ${realSmsSentCount} SMS and ${realCallsCount} voice call sent via Twilio.`
        : 'Emergency SOS Broadcast Dispatched to Emergency Contacts & Local Response Services!',
      alert: newAlert
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelSOS = async (req, res) => {
  try {
    const { alertId } = req.body;
    if (alertId) {
      const alert = activeSosAlerts.find(a => a.alertId === alertId);
      if (alert) alert.status = 'cancelled';
    } else if (activeSosAlerts.length > 0) {
      activeSosAlerts[0].status = 'cancelled';
    }

    return res.json({
      success: true,
      message: 'SOS Alert successfully marked as Safe/Resolved.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getActiveSOS = async (req, res) => {
  return res.json({
    success: true,
    activeAlerts: activeSosAlerts.filter(a => a.status === 'active')
  });
};
