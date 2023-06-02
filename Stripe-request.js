const pi = args[1];
const url = `https://api.stripe.com/v1/checkout/sessions/${pi}`;
// console.log(`Get name, capital and currency for country code: ${countryCode}`)
console.log(`HTTP POST Request to ${url}`);
const countryRequest = Functions.makeHttpRequest({
  url: url,
  method: "GET",
  headers: {
    authorization:
      "Basic c2tfdGVzdF81MU40VTY0Szczdk1TNUxES1V5Y0tUeVR4TTNMbFVDUlNwMzh0aFFTYVdBTVBqbzg0bzZ1VFozQ2hNSUF6M21iR05nc3ZKeEVwMkhVbVBobk5hbW82S2g4MDAwaE9VQ3hvdEY6",
  },
});

// Execute the API request (Promise)
const countryResponse = await countryRequest;
console.log(countryResponse);
if (countryResponse.error) {
  console.error(
    countryResponse.response
      ? `${countryResponse.response.status},${countryResponse.response.statusText}`
      : ""
  );
  throw Error("Request failed to");
}

const countryData = countryResponse["data"];
console.log(countryData);

// result is in JSON object
const result = {
  name: countryData.id,
  capital: countryData.amount,
  currency: countryData.currency,
};

// Use JSON.stringify() to convert from JSON object to JSON string
// Finally, use the helper Functions.encodeString() to encode from string to bytes
return Buffer.concat([
  Functions.encodeUint256(0),
  Functions.encodeUint256(countryData.amount_total / 100)
])
// return Functions.encodeString(JSON.stringify(result))
