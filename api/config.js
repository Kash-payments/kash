import * as dotenv from 'dotenv'
dotenv.config();

export const configVars = {
  schemaPayments: "KASHPAYMENTS.PAYMENTS",
  schemaUsers: "KASHPAYMENTS.USERS",
  schemaStores: "KASHPAYMENTS.STORES",
  dql: 'https://hackathon.spaceandtime.dev/v1/sql/dql',
  ddl: 'https://hackathon.spaceandtime.dev/v1/sql/ddl',
  dml: 'https://hackathon.spaceandtime.dev/v1/sql/dml',
  biscuit: process.env.BISCUIT,
  privateKey: process.env.PRIVATE_KEY,
  publicKey: process.env.PUBLIC_KEY,
  privateBiscuit: process.env.PRIVATE_BISCUIT,
  publicBiscuit: process.env.PUBLIC_BISCUIT,
}
