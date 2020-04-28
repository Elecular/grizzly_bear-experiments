const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const signKey = process.env.AUTH_SIGN_KEY_URI;
const audiance = process.env.AUTH_AUDIENCE;
const issuer = process.env.AUTH_DOMAIN;

if (!signKey || !audiance || !issuer) {
    throw new Error(
        "AUTH_SIGN_KEY_URI, AUTH_AUDIENCE and AUTH_DOMAIN environment variables are not found",
    );
}

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
        jwksUri: signKey,
    }),

    // Validate the audience and the issuer.
    audience: audiance,
    issuer: issuer,
    algorithms: ["RS256"],
});

module.exports.checkJwt = checkJwt;
