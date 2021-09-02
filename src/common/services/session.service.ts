import { observable, action, reaction } from 'mobx';
import {
  SessionStorageService,
  TokensData,
} from './storage/session.storage.service';
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
export class SessionService {
  @observable userLoggedIn = false;
  @observable ready = false;

  @observable tokensData: Array<TokensData> = [];
  @observable activeIndex: number = 0;

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
      if (sessionData === null || sessionData === undefined) {
        this.setToken(null);
        this.setRefreshToken(null);
        this.setReady();
        return null;
      }

      this.setActiveIndex(sessionData.activeIndex);
      this.setTokensData(sessionData.tokensData);

      const { accessToken, refreshToken, user } = this.tokensData[
        this.activeIndex
      ];

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
      this.tokensData[this.activeIndex] = this.buildSessionData(tokens);
      this.saveToStore();
    } else {
      throw new TokenExpiredError('Session Expired');
    }
  }

  async loadUser(user?: UserModel) {
    if (user) {
      getStores().user.setUser(user);
      // we update the user without wait
      getStores().user.load(true);
    } else {
      user = await getStores().user.load();
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
  setTokensData(tokensData: Array<TokensData>) {
    this.tokensData = tokensData;
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
   * Login the current active index
   * @param {string} token
   * @param {boolean} loadUser
   */
  @action
  async login() {
    // create user data storage
    if (this.guid) {
      createUserStore(this.guid);
      SettingsStore.loadUserSettings();
    }

    this.setLoggedIn(true);
  }

  /**
   * Add new tokens info from login to tokens data;
   * @param tokens
   */
  async addSession(tokens) {
    try {
      await this.setTokens(tokens);

      // get session data from tokens returned by login
      const sessionData = this.buildSessionData(tokens);

      // add data to current tokens data array
      const tokensData = this.tokensData;
      tokensData.push(sessionData);
      this.setTokensData(tokensData);

      // set the active index wich will be logged
      this.setActiveIndex(this.tokensData.length - 1);

      // save all data into session storage
      this.saveToStore();
    } catch (err) {
      logService.exception('[SessionService addSession]', err);
    }
  }

  async switchUser(sessionIndex: number) {
    this.setActiveIndex(sessionIndex);
    const tokensData = this.tokensData[sessionIndex];
    await this.setTokens(
      {
        access_token: tokensData.accessToken.access_token,
        refresh_token: tokensData.refreshToken.refresh_token,
      },
      this.tokensData[this.activeIndex].user,
    );
    this.saveToStore();
  }

  async setTokens(tokens, user?: UserModel) {
    this.setToken(tokens.access_token);
    this.setRefreshToken(tokens.refresh_token);
    await this.loadUser(user);
  }

  saveToStore() {
    this.sessionStorage.save({
      tokensData: this.tokensData,
      activeIndex: this.activeIndex,
    });
  }

  /**
   * Get the token for a given index on tokensData
   * @param index
   * @returns the access token
   */
  getTokenWithIndex(index: number) {
    return this.tokensData[index].accessToken.access_token;
  }

  buildSessionData(tokens) {
    const token_expire = this.getTokenExpiration(tokens.access_token);
    const token_refresh_expire = token_expire + 60 * 60 * 24 * 30;
    return {
      user: getStores().user.me,
      accessToken: {
        access_token: tokens.access_token,
        access_token_expires: token_expire,
      },
      refreshToken: {
        refresh_token: tokens.refresh_token,
        refresh_token_expires: token_refresh_expire,
      },
    };
  }

  @action
  setActiveIndex(activeIndex: number) {
    this.activeIndex = activeIndex;
  }

  getIndexSessionFromGuid(guid: string) {
    const index = this.tokensData.findIndex(v => guid === v.user.guid);
    return index >= 0 ? index : false;
  }

  /**
   * Logout current user
   */
  logout(clearStorage = true) {
    this.guid = null;
    this.setToken(null);
    this.setRefreshToken(null);
    this.setLoggedIn(false);
    if (clearStorage) {
      const tokensData = this.tokensData;
      tokensData.splice(this.activeIndex, 1);
      this.setTokensData(tokensData);
      this.setActiveIndex(0);
      this.saveToStore();
    }
  }

  /**
   * Logout user for a given index
   */
  logoutFrom(index: number) {
    if (index === this.activeIndex) {
      this.logout();
    } else {
      const guid = this.tokensData[this.activeIndex].user.guid;
      const tokensData = this.tokensData;
      tokensData.splice(index, 1);
      this.setTokensData(tokensData);
      const newIndex = this.getIndexSessionFromGuid(guid);
      this.setActiveIndex(newIndex || 0);
    }
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
