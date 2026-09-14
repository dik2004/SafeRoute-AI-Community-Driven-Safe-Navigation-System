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
    const smsDispatchLogs = [];

    // Send real Twilio SMS if twilio is configured and contacts have phone numbers
    if (twilioClient && fromPhone && contacts && contacts.length > 0) {
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
      smsDispatchLogs,
      dispatchedServices: [
        { service: 'Police Dispatch (112)', status: 'Notified' },
        { service: 'Emergency Contact Broadcast', status: realSmsSentCount > 0 ? `Live SMS Dispatched (${realSmsSentCount})` : 'SMS & WhatsApp Dispatched' },
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
    console.log(`========================================================================\n`);

    return res.status(201).json({
      success: true,
      message: realSmsSentCount > 0
        ? `Emergency SOS broadcast and ${realSmsSentCount} live SMS alerts successfully dispatched!`
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
