import { Logging } from "homebridge";
import fetch, { Headers } from "node-fetch";
import { API_URL, AUTH_TOKEN_HEADER_NAME } from "./settings";
import { CreateAuthCodePostResponse, CreateAccessTokenPostResponse, GetUserSettingsPostResponse, GetAllDeviceDataPostResponse } from "./types";

export class RControlAPI {
    private logger: Logging;
    private headers: Headers;

    constructor(logger: Logging) {
        this.logger = logger;
        this.headers = new Headers();
        this.headers.set('Content-Type', 'application/json');
    }

    isLoggedIn = (): boolean => {
        return this.headers.has(AUTH_TOKEN_HEADER_NAME);
    }

    login = async (username: string, password: string) => {
        const createAuthCodeResponse = await this.createAuthCode(username, password);
        const authCode = createAuthCodeResponse?.AuthCode;
        if (authCode) {
            const createAccessTokenResponse = await this.createAccessToken(authCode);
            const accessToken = createAccessTokenResponse?.AccessToken;
            if (accessToken) this.headers.set(AUTH_TOKEN_HEADER_NAME, accessToken);
        }
    }

    createAuthCode = async (username: string, password: string): Promise<CreateAuthCodePostResponse | undefined> => {
        const url = API_URL + 'createauthorizationcode';
        const body = {
            'AdminRequest': false,
            'UserName': username,
            'UserPass': password
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.headers
            });
            const json: CreateAuthCodePostResponse = await response.json();
            return json;
        } catch (error) {
            this.logger.error('Failed to login to RControl; could not create authorization code. Error: ' + error);
            return undefined;
        }
    }

    createAccessToken = async (authCode: string): Promise<CreateAccessTokenPostResponse | undefined> => {
        const url = API_URL + 'createaccesstoken';
        const body = {
            'AuthCode': authCode,
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.headers
            });
            const json: CreateAccessTokenPostResponse = await response.json();
            return json;
        } catch (error) {
            this.logger.error('Failed to login to RControl; could not create access token. Error: ' + error);
            return undefined
        }
    }

    getUserSettings = async (): Promise<GetUserSettingsPostResponse | undefined> => {
        if (!this.isLoggedIn()) return;
        const url = API_URL + 'gethausersettings';
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: this.headers
            })
            const json: GetUserSettingsPostResponse = await response.json();
            return json;
        } catch (error) {
            this.logger.error('Failed to fetch current alarm state; could not get user settings. Error: ' + error);
            return undefined;
        }
    }

    getAllDeviceData = async (body: {}): Promise<GetAllDeviceDataPostResponse | undefined> => {
        if (!this.isLoggedIn()) return;
        const url = API_URL + 'getalldevicedata';
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.headers
            })
            const json: GetAllDeviceDataPostResponse = await response.json();
            return json;
        } catch (error) {
            this.logger.error('Failed to fetch current alarm state; could not get device data. Error: ' + error);
            return undefined;
        }
    }

    updateArmStatus = async (body: {}) => {
        if (!this.isLoggedIn()) return;
        const url = API_URL + 'remotearm';
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.headers
            })
            const json = await response.json();
            return json;
        } catch (error) {
            this.logger.error('Failed to update alarm state. Error: ' + error);
            return undefined;
        }
    }

}