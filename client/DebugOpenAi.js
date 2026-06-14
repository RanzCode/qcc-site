// DEBUG: log full OpenAI response status and body (remove after debugging)
console.log('OpenAI response status:', openaiResp.status);
console.log('OpenAI response data keys:', Object.keys(openaiResp.data || {}));
if (openaiResp.data && openaiResp.data.choices) {
  console.log('Choice 0 preview:', (openaiResp.data.choices[0].message || {}).content?.slice(0,200));
}