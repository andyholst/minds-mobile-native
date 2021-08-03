import { observable, action, reaction } from 'mobx';
import { SessionStorageService } from './storage/session.storage.service';
import AuthService from '../../auth/AuthService';
import { getStores } from '../../../AppStores';
import logService from './log.service';
import type UserModel from '../../channel/UserModel';
import { createUserStore } from './storage/storages.service';
import SettingsStore from '../../settings/SettingsStore';

export class TokenExpiredError extends Error {}

export const isTokenExpired = error => {
  return error instanceof TokenExpiredError;
};

/**
 * Session service
 */
class SessionService {
  @observable userLoggedIn = false;
  @observable ready = false;

  /**
   * Session token
   */
  token = '';

  /**
   * Refresh token
   */
  refreshToken = '';

  /**
   * Tokens TTL
   */
  accessTokenExpires: number | null = null;
  refreshTokenExpires: number | null = null;

  /**
   * User guid
   */
  guid: string | null = null;

  /**
   * Session storage service
   */
  sessionStorage: SessionStorageService;

  /**
   * Initial screen
   */
  initialScreen = '';

  @observable refreshingTokens = false;

  recoveryCodeUsed = false;

  /**
   * Constructor
   * @param {object} sessionStorage
   */
  constructor(sessionStorage: SessionStorageService) {
    this.sessionStorage = sessionStorage;
  }

  /**
   * Init service
   */
  async init() {
    try {
      const sessionData = this.sessionStorage.getAll();

      // if there is no session active we clean up and return;
      if (sessionData === null) {
        this.setToken(null);
        this.setRefreshToken(null);
        this.setReady();
        return null;
      }

      const [accessToken, refreshToken, user] = sessionData;

      const { access_token, access_token_expires } = accessToken;
      const { refresh_token, refresh_token_expires } = refreshToken;

      this.refreshTokenExpires = refresh_token_expires;
      this.accessTokenExpires = access_token_expires;

      this.setRefreshToken(refresh_token);
      this.setToken(access_token);

      // ensure user loaded before activate the session
      await this.loadUser(user);

      if (this.guid) {
        createUserStore(this.guid);
        SettingsStore.loadUserSettings();
      }
      this.setReady();
      this.setLoggedIn(true);

      return access_token;
    } catch (e) {
      this.setToken(null);
      this.setRefreshToken(null);
      logService.exception('[SessionService] error getting tokens', e);
      return null;
    }
  }

  tokenCanRefresh() {
    return (
      this.refreshToken &&
      this.refreshTokenExpires &&
      this.refreshTokenExpires * 1000 > Date.now()
    );
  }

  async refreshAuthToken() {
    logService.info('[SessionService] refreshing token');
    if (this.tokenCanRefresh()) {
      const tokens = await AuthService.refreshToken();
      this.setRefreshToken(tokens.refresh_token);
      this.setToken(tokens.access_token);

      this.storeTokens(tokens);
    } else {
      throw new TokenExpiredError('Session Expired');
    }
  }

  async loadUser(user?: UserModel) {
    if (user) {
      getStores().user.setUser(user);
      // we update the user without wait
      getStores()
        .user.load(true)
        .then(user => {
          if (user) this.sessionStorage.setUser(user);
        });
    } else {
      user = await getStores().user.load();
      this.sessionStorage.setUser(user);
    }

    this.guid = user.guid;
  }

  /**
   * Return current user
   */
  getUser(): UserModel {
    return getStores().user.me;
  }

  /**
   * Set initial screen
   * @param {string} screen
   */
  setInitialScreen(screen) {
    this.initialScreen = screen;
  }

  /**
   * Parse jwt
   * @param {string} token
   */
  parseJwt(token) {
    try {
      //@ts-ignore
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  /**
   * Get expiration datetime from token
   * @param {string} token
   */
  getTokenExpiration(token) {
    const parsed = this.parseJwt(token);
    if (parsed && parsed.exp) return parsed.exp;
    return null;
  }

  @action
  setLoggedIn(value) {
    this.userLoggedIn = value;
  }

  @action
  setReady() {
    this.ready = true;
  }

  /**
   * Set token
   */
  setToken(token) {
    this.token = token;
  }

  @action
  setTokenRefreshing(refreshing) {
    this.refreshingTokens = refreshing;
  }

  /**
   * Set refresh token
   */
  setRefreshToken(token) {
    this.refreshToken = token;
  }

  /**
   * Login
   * @param {string} token
   * @param {boolean} loadUser
   */
  @action
  async login(tokens, loadUser = true) {
    this.setToken(tokens.access_token);
    this.setRefreshToken(tokens.refresh_token);

    // ensure user loaded before activate the session
    if (loadUser) {
      await this.loadUser();
    }

    // create user data storage
    if (this.guid) {
      createUserStore(this.guid);
      SettingsStore.loadUserSettings();
    }

    this.setLoggedIn(true);

    this.storeTokens(tokens);
  }

  /**
   * save token to storage
   */
  async storeTokens(tokens) {
    const token_expire = this.getTokenExpiration(tokens.access_token);
    const token_refresh_expire = token_expire + 60 * 60 * 24 * 30;

    this.sessionStorage.setAccessToken(tokens.access_token, token_expire);
    this.sessionStorage.setRefreshToken(
      tokens.refresh_token,
      token_refresh_expire,
    );
  }

  /**
   * Logout
   */
  logout() {
    this.guid = null;
    this.setToken(null);
    this.setRefreshToken(null);
    this.setLoggedIn(false);
    this.sessionStorage.clear();
  }

  /**
   * Run on session change
   * @return dispose (remember to dispose!)
   * @param {function} fn
   */
  onSession(fn) {
    return reaction(
      () => [this.userLoggedIn ? this.token : null],
      async args => {
        try {
          await fn(...args);
        } catch (error) {
          logService.exception('[SessionService]', error);
        }
      },
      { fireImmediately: true },
    );
  }

  /**
   * Run on session change
   * @return dispose (remember to dispose!)
   * @param {function} fn
   */
  onLogin(fn) {
    return reaction(
      () => (this.userLoggedIn ? this.token : null),
      async token => {
        if (token) {
          try {
            await fn(token);
          } catch (error) {
            logService.exception('[SessionService]', error);
          }
        }
      },
      { fireImmediately: true },
    );
  }

  /**
   * Run on session
   * @return dispose (remember to dispose!)
   * @param {function} fn
   */
  onLogout(fn) {
    return reaction(
      () => (this.userLoggedIn ? this.token : null),
      async token => {
        if (!token) {
          try {
            await fn(token);
          } catch (error) {
            logService.exception('[SessionService]', error);
          }
        }
      },
      { fireImmediately: false },
    );
  }

  /**
   * Clear messenger keys
   */
  clearMessengerKeys() {
    return this.sessionStorage.clearPrivateKey();
  }

  setRecoveryCodeUsed(used: boolean) {
    this.recoveryCodeUsed = used;
  }
}

export default new SessionService(new SessionStorageService());
