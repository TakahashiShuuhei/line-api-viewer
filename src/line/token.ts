import { getSecret } from "../utils/secret";
import jose from "node-jose";
import axios from "axios";
import { get, save } from '../utils/datastore';

// https://developers.line.biz/ja/docs/messaging-api/generate-json-web-token/#jwt-use-nodejs
export const issueJWT = async () => {
  const privateKey = await getSecret("line-priv-key");
  const kid = await getSecret("line-kid");
  const channelId = process.env.CHANNEL_ID;

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid,
  };

  const payload = {
    iss: channelId,
    sub: channelId,
    aud: "https://api.line.me/",
    exp: Math.floor(new Date().getTime() / 1000) + 60 * 30,
    token_exp: 60 * 60 * 24 * 30,
  };

  return await jose.JWS.createSign(
    { format: "compact", fields: header },
    JSON.parse(privateKey)
  )
    .update(JSON.stringify(payload))
    .final();
};

type ChannelAccessToken = {
  access_token: string;
  expires_in: number;
};

// https://developers.line.biz/ja/docs/messaging-api/generate-json-web-token/#issue_a_channel_access_token_v2_1
export const issueChannelAccessToken = async (): Promise<ChannelAccessToken> => {
  const jwt = await issueJWT();
  const url = `https://api.line.me/oauth2/v2.1/token`;

  const res = await axios.post(
    url,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: jwt.toString(),
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return res.data as ChannelAccessToken;
};

interface TokenData {
  access_token: string;
  expires_at: number; // Unix timestamp
}

const SAFETY_MARGIN = 5 * 60; // 5分の余裕を持たせる（秒）
const TOKEN_KIND = 'LineAccessToken';
const TOKEN_ID = 'current';

export const getAccessToken = async (): Promise<string> => {
  try {
    const token = await get(TOKEN_KIND, TOKEN_ID);
    
    if (token && token.expires_at) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < token.expires_at - SAFETY_MARGIN) {
        return token.access_token;
      }
    }
    
    const newToken = await issueChannelAccessToken();
    const tokenData: TokenData = {
      access_token: newToken.access_token,
      expires_at: Math.floor(Date.now() / 1000) + newToken.expires_in
    };
    
    await save(TOKEN_KIND, TOKEN_ID, tokenData);
    return newToken.access_token;
    
  } catch (error) {
    console.error('Error managing access token:', error);
    throw error;
  }
};

