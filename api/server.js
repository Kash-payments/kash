import express from "express"
import bodyParser from "body-parser";
import { transactions } from "./transactions.js"
import SpaceAndTimeSDK from "./SpaceAndTimeSDK.js";
const app = express()
const port = 3000

app.use(bodyParser.json())
const initSDK = SpaceAndTimeSDK.init();


app.get('/payments', async (req, res) => {
  // await getToken()
  let [tokenResponse, tokenError] = await initSDK.AuthenticateUser();
  console.log("holaaaaa")
  console.log("testtt", tokenResponse, tokenError)
  // let token = initSDK.retrieveFileContents().accessToken
  console.log("token", token)
  const result = await transactions.getAll(token)
  return res.json(result)
})

app.post('/payments', async (req, res) => {
  await getToken()
  console.log("token", token)
  let token = initSDK.retrieveFileContents().accessToken
  const result = await transactions.insert(token, req.body)
  return res.json(result)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

async function getToken() {
  let [validAccessTokenResponse, validAccessTokenError] = await initSDK.validateToken();
  if (validAccessTokenResponse) {
    console.log('Valid access token provided.');
    console.log('Valid User ID: ', validAccessTokenResponse);
  }
  else {
    let [refreshTokenResponse, refreshTokenError] = await initSDK.refreshToken();
    console.log('Refreshed Tokens: ', refreshTokenResponse);

    if (!refreshTokenResponse) {
      let [tokenResponse, tokenError] = await initSDK.AuthenticateUser();
      if (!tokenError) {
        console.log(tokenResponse);
      }
      else {
        console.log('Invalid User Tokens Provided');
        console.log(tokenError);
      }
    }
  }
}
