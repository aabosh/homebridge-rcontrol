export interface Options {
    name: string,
    username: string,
    password: string,
    pin: string
}

export interface CreateAuthCodePostResponse {
    AdminLogin: string,
    AuthCode: string,
    ErrorCode: number,
    ErrorMsg: string,
    Success: boolean
}

export interface CreateAccessTokenPostResponse {
    AccessToken: string,
    AdminLogin: boolean,
    ErrorCode: number,
    ErrorMsg: string,
    RefreshToken: string, 
    Success: boolean
}

interface AlarmIMEIUserNumber {
    IMEI: string,
    Number: string
}

export interface GetUserSettingsPostResponse {
    ErrorCode: number,
    ErrorString: string,
    HAUserSettings: {
        Administrator: boolean,
        AlarmIMEIUserNumbers: AlarmIMEIUserNumber[],
        AvailableCultures: any,
        ClientID: number,
        ControllerPermitions: any,
        Culture: string,
        DiagnosticEnable: boolean,
        Email: string,
        GDPRAgreements: boolean,
        HasCreditAcount: boolean,
        ID: string,
        IsApproved: boolean,
        IsLockedOut: boolean,
        Name: string,
        OwnerUserID: string,
        PasswordNew: string,
        PasswordOld: string,
        PhoneCulture: string,
        ReadOnly: boolean,
        UserName: string,
        UserNameNew: string
    },
    Success: boolean,
    SystemSettingsVersion: string
}

interface ExternalDevice {
    DeviceState: number,
    DevicePIN: number,
    PartitionNumber: string
}

export interface GetAllDeviceDataPostResponse {
    AlarmControlSettingsV2Response: {
        SerialNumber: string,
        ExternalDevices: ExternalDevice[]
    },
    ClientDeviceDataV2Response: {
        SerialNumber: string,
        SiteNo: string
    }
}

export enum ServerAlarmState {
    ARMING = -1,
    ARMED = 1,
    DISARMED = 2
}