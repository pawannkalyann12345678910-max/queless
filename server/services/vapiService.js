/**
 * Vapi Voice AI Outbound Calling Service
 * Connects to Vapi API (vapi.ai) to trigger automated robot phone calls to customers
 */

/**
 * Clean and format phone number into E.164 international format (+1..., +91...)
 */
export function formatE164Phone(rawPhone) {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length === 10) {
    digits = '91' + digits; // Default fallback to India +91 if 10 digits
  }
  return '+' + digits;
}

/**
 * Fetch available phone numbers from the user's Vapi account
 */
export async function getVapiPhoneNumbers(apiKey) {
  if (!apiKey) throw new Error('Vapi Private API Key is required');

  const response = await fetch('https://api.vapi.ai/phone-number', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vapi API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(p => ({
    id: p.id,
    number: p.number || p.phoneNumber || p.name || p.id,
    name: p.name || 'Primary Vapi Number',
    provider: p.provider || 'vapi'
  })) : [];
}

/**
 * Auto-buy / provision a phone number in user's Vapi account using their free credits
 */
export async function buyVapiPhoneNumber(apiKey, areaCode = '415') {
  if (!apiKey) throw new Error('Vapi Private API Key is required');

  const response = await fetch('https://api.vapi.ai/phone-number/buy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      areaCode: areaCode,
      name: 'Queless Outbound Voice'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to claim phone number (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Fetch assistants from user's Vapi account
 */
export async function getVapiAssistants(apiKey) {
  if (!apiKey) throw new Error('Vapi Private API Key is required');

  const response = await fetch('https://api.vapi.ai/assistant', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(a => ({
    id: a.id,
    name: a.name || 'Queue Voice Agent'
  })) : [];
}

/**
 * Trigger an automated outbound phone call via Vapi Voice AI
 */
export async function makeVapiOutboundCall({
  apiKey,
  phoneNumberId,
  assistantId,
  customerPhone,
  customerName = 'Valued Customer',
  tokenNumber = '',
  counterLabel = 'Counter 1',
  orgName = 'Service Desk'
}) {
  if (!apiKey) {
    throw new Error('Vapi API Key not configured. Please add your Vapi Private API Key in Admin Console.');
  }

  const formattedPhone = formatE164Phone(customerPhone);
  if (!formattedPhone) {
    throw new Error('Invalid customer phone number.');
  }

  // If no phone number ID provided, attempt auto-fetching the first available number in their account
  let targetPhoneNumberId = phoneNumberId;
  if (!targetPhoneNumberId) {
    const phoneNumbers = await getVapiPhoneNumbers(apiKey);
    if (phoneNumbers.length > 0) {
      targetPhoneNumberId = phoneNumbers[0].id;
    } else {
      throw new Error('No active phone number found in your Vapi account. In your Vapi Dashboard (vapi.ai/phone-numbers), click "Buy Number" using your $10 free credit.');
    }
  }

  const firstMessage = `Hello ${customerName}, this is an automated priority update from ${orgName}. Your turn for Token ${tokenNumber} has arrived at ${counterLabel}. Please proceed to the counter area now. Thank you!`;

  const requestPayload = {
    phoneNumberId: targetPhoneNumberId,
    customer: {
      number: formattedPhone,
      name: customerName
    }
  };

  // If user provided a pre-configured assistantId
  if (assistantId && assistantId.trim()) {
    requestPayload.assistantId = assistantId.trim();
    requestPayload.assistantOverrides = {
      firstMessage,
      variableValues: {
        customerName,
        tokenNumber,
        counterLabel,
        orgName
      }
    };
  } else {
    // Built-in intelligent Queue Calling Assistant
    requestPayload.assistant = {
      firstMessage,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            "role": "system",
            "content": `You are an automated, friendly voice notification assistant for ${orgName}. You are calling customer ${customerName} to let them know that their turn for Token ${tokenNumber} is now being served at ${counterLabel}. If they confirm or ask where to go, politely tell them to proceed to ${counterLabel} at ${orgName}. Keep your answers concise, clear, and under 2 sentences. When the customer confirms or says okay, say 'Thank you, see you at the counter!' and end the call.`
          }
        ]
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah"
      },
      endCallMessage: "Thank you for using Queless. Have a great day!"
    };
  }

  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMsg = errorText;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.message) parsedMsg = errJson.message;
    } catch (e) {}

    if (parsedMsg.includes('activating')) {
      throw new Error('⏳ Your new phone number is currently completing carrier network activation (takes 1-2 minutes). Please try placing the call again in 60 seconds.');
    }
    throw new Error(`Call Failed: ${parsedMsg}`);
  }

  const result = await response.json();
  return {
    success: true,
    callId: result.id,
    status: result.status || 'queued',
    recipient: formattedPhone,
    phoneNumberId: targetPhoneNumberId
  };
}
