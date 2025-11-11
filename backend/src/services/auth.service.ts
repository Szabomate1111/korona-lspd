import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserModel } from '../models/user.model';
import { AuthPayload } from '../types';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export const AuthService = {
  async exchangeCodeForToken(code: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.discordClientId,
      client_secret: config.discordClientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.discordRedirectUri,
    });

    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  },

  async getDiscordUser(accessToken: string): Promise<DiscordUser> {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  },

  async authenticateUser(code: string): Promise<{ token: string; user: any }> {
    // Exchange code for access token
    const accessToken = await this.exchangeCodeForToken(code);

    // Get Discord user info
    const discordUser = await this.getDiscordUser(accessToken);

    // Check if user exists in database
    let user = await UserModel.findByDiscordId(discordUser.id);

    if (!user) {
      throw new Error('User not authorized. Contact an owner to add you as admin.');
    }

    // Generate JWT
    const payload: AuthPayload = {
      userId: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

    return { token, user };
  },

  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: config.discordClientId,
      redirect_uri: config.discordRedirectUri,
      response_type: 'code',
      scope: 'identify',
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  },
};
