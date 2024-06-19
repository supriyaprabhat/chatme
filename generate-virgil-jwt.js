const { initCrypto, VirgilCrypto, VirgilAccessTokenSigner } = require('virgil-crypto');
const { JwtGenerator } = require('virgil-sdk');

const app_id = ""
const app_key_id = ""
const app_key = ""



async function getJwtGenerator() {
  await initCrypto();
  
  const crypto = new VirgilCrypto();
    return new JwtGenerator({
    appId: app_id,
    apiKeyId: app_key_id,
    apiKey: crypto.importPrivateKey(app_key),
    accessTokenSigner: new VirgilAccessTokenSigner(crypto),
  });
}

 async function generateVirgilJwt(identity) {
  const generator = await getJwtGenerator();
  return generator.generateToken(identity);
}
module.exports = {generateVirgilJwt}
