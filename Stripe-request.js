const pi = args[1];
const url = `https://api.stripe.com/v1/checkout/sessions/${pi}`;
const countryRequest = Functions.makeHttpRequest({
  url: url,
  method: "GET",
  headers: {
    authorization:
      "Basic c2tfdGVzdF81MU40VTY0Szczdk1TNUxES1V5Y0tUeVR4TTNMbFVDUlNwMzh0aFFTYVdBTVBqbzg0bzZ1VFozQ2hNSUF6M21iR05nc3ZKeEVwMkhVbVBobk5hbW82S2g4MDAwaE9VQ3hvdEY6",
  },
});

const countryResponse = await countryRequest;
if (countryResponse.error) {
  console.error(
    countryResponse.response
      ? `${countryResponse.response.status},${countryResponse.response.statusText}`
      : ""
  );
  throw Error("Request failed to");
}

const countryData = countryResponse["data"];

return Buffer.concat([
  Functions.encodeUint256(0),
  Functions.encodeUint256(countryData.amount_total / 100)
])

