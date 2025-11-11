import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import config from '../config';

export const AuthController = {
  getAuthUrl(req: Request, res: Response) {
    const authUrl = AuthService.generateAuthUrl();
    res.redirect(authUrl);
  },

  async callback(req: Request, res: Response) {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return res.redirect(`${config.frontendUrl}/auth/error?message=No code provided`);
      }

      const { token, user } = await AuthService.authenticateUser(code);

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to admin panel
      res.redirect(`${config.frontendUrl}/admin`);
    } catch (error: any) {
      console.error('Auth callback error:', error);
      const message = encodeURIComponent(error.message || 'Authentication failed');
      res.redirect(`${config.frontendUrl}/auth/error?message=${message}`);
    }
  },

  logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({ ok: true, message: 'Logged out successfully' });
  },

  async me(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user info', code: 'GET_USER_ERROR' });
    }
  },
};
