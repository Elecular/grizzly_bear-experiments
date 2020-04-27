const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `https://grizzly-bear.eu.auth0.com/.well-known/jwks.json`,
    }),

    // Validate the audience and the issuer.
    audience: "http://www.grizzlybear-experiments.com",
    issuer: `https://grizzly-bear.eu.auth0.com/`,
    algorithms: ["RS256"],
});

module.exports.checkJwt = checkJwt;
