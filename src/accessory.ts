import { AccessoryConfig, AccessoryPlugin, API, CharacteristicEventTypes, CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, HAP, Logging, Service} from "homebridge";
import { ServerAlarmState, Options, GetUserSettingsPostResponse, GetAllDeviceDataPostResponse } from "./types";
import { RControlAPI } from "./api";

export = (api: API) => {
    api.registerAccessory("RControl", RControl);
};

class RControl implements AccessoryPlugin {

    private readonly logger: Logging;
    private readonly config: Options;
    private readonly service: Service;
    private readonly informationService: Service;
    private readonly hap: HAP;
    private readonly rcontrolApi: RControlAPI

    private lastUserSettingsResponse: GetUserSettingsPostResponse | undefined = undefined;
    private lastDeviceDataResponse: GetAllDeviceDataPostResponse | undefined = undefined;
    private targetState: CharacteristicValue | undefined = undefined;

    constructor(logger: Logging, config: AccessoryConfig, api: API) {
        this.hap = api.hap;
        this.logger = logger;

        this.config = {
            name: config.name as string,
            username: config.username as string,
            password: config.password as string,
            pin: config.pin as string
        };

        this.service = new this.hap.Service.SecuritySystem(config.name);
        this.rcontrolApi = new RControlAPI(logger);

        this.service.getCharacteristic(this.hap.Characteristic.SecuritySystemCurrentState)
            .on(CharacteristicEventTypes.GET, this.handleSecuritySystemCurrentStateGet.bind(this));

        this.service.getCharacteristic(this.hap.Characteristic.SecuritySystemTargetState)
            .on(CharacteristicEventTypes.GET, this.handleSecuritySystemTargetStateGet.bind(this))
            .on(CharacteristicEventTypes.SET, this.handleSecuritySystemTargetStateSet.bind(this));

        this.informationService = new this.hap.Service.AccessoryInformation();

        if (!this.config.username || !this.config.password) {
            this.logger.error("No RControl credentials provided.");
        } else {
            this.rcontrolApi.login(this.config.username, this.config.password);
        }
    }

    handleSecuritySystemCurrentStateGet(callback: CharacteristicGetCallback) {
        this.getCurrentAlarmState().then(state => {
            callback(null, state);
        });
    }

    handleSecuritySystemTargetStateGet(callback: CharacteristicGetCallback) {
        if (this.targetState) {
            callback(null, this.targetState);
        } else {
            this.getCurrentAlarmState().then(state => {
                this.targetState = state;
                callback(null, state);
            });
        }
    }

    handleSecuritySystemTargetStateSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        const targetServerState = this.hapStateToServerState(value);
        this.targetState = this.serverStateToHapState(targetServerState);
        this.updateAlarmState(targetServerState).then(() => {
            callback();
        });
    }

    getCurrentAlarmState = async (): Promise<CharacteristicValue | undefined> => {
        if (this.lastUserSettingsResponse === undefined) { // We haven't fetched user settings yet
            const userSettingsResponse = await this.rcontrolApi.getUserSettings();
            if (userSettingsResponse === undefined) return;

            if (userSettingsResponse.HAUserSettings.AlarmIMEIUserNumbers.length === 0) {
                this.logger.error('Failed to fetch alarm state: the provided credentials have no alarms in the account.');
            } else {
                this.lastUserSettingsResponse = userSettingsResponse;
            }
        }

        if (this.lastUserSettingsResponse === undefined) return;
        const body = {
            // The following is what the API expects (as per the iOS app)
            'IMEI': this.lastUserSettingsResponse.HAUserSettings.AlarmIMEIUserNumbers[0].IMEI,
            'UserID': this.lastUserSettingsResponse.HAUserSettings.ID,
            'SerialNumber': '',
            'ReturnCamerasData': true,
            'ProtocolNumber': 4
        }
        const deviceDataResponse = await this.rcontrolApi.getAllDeviceData(body);
        if (deviceDataResponse?.AlarmControlSettingsV2Response.ExternalDevices.length === 0) {
            this.logger.error('Failed to fetch alarm state: the provided credentials have no external devices in the account.');
        } else {
            this.lastDeviceDataResponse = deviceDataResponse;
        }
        const deviceState = deviceDataResponse?.AlarmControlSettingsV2Response.ExternalDevices[0].DeviceState;
        return deviceState ? this.serverStateToHapState(deviceState) : undefined;
    }

    updateAlarmState = async (newState: ServerAlarmState) => {
        if (this.lastUserSettingsResponse === undefined || this.lastDeviceDataResponse === undefined) return;
        const body = {
            // The following is what the API expects (as per the iOS app)
            'IMEI': this.lastUserSettingsResponse.HAUserSettings.AlarmIMEIUserNumbers[0].IMEI,
            'UserNumber': this.lastUserSettingsResponse.HAUserSettings.AlarmIMEIUserNumbers[0].Number,
            'ArmingState': newState,
            'OutDelay': '',
            'UserPIN': this.config.pin,
            'SerialNumber': this.lastDeviceDataResponse.AlarmControlSettingsV2Response.SerialNumber,
            'ProtocolNumber': 4,
            'OutPIN': String(this.lastDeviceDataResponse.AlarmControlSettingsV2Response.ExternalDevices[0].DevicePIN),
            'PartitionNumber': this.lastDeviceDataResponse.AlarmControlSettingsV2Response.ExternalDevices[0].PartitionNumber
        }

        return this.rcontrolApi.updateArmStatus(body);
    }

    serverStateToHapState(serverState: ServerAlarmState): CharacteristicValue {
        // RControl only supports two states; armed and disarmed. HAP has four states. To workaround this, only the away and disarmed states in HAP are used.
        return serverState == ServerAlarmState.ARMED ? this.hap.Characteristic.SecuritySystemTargetState.AWAY_ARM : this.hap.Characteristic.SecuritySystemTargetState.DISARM;
    }

    hapStateToServerState(hapState: CharacteristicValue): ServerAlarmState {
        // RControl only supports two states; armed and disarmed. HAP has four states. To workaround this, only the away and disarmed states in HAP are used.
        return hapState == this.hap.Characteristic.SecuritySystemTargetState.DISARM ? ServerAlarmState.DISARMED : ServerAlarmState.ARMED;
    }

    getServices(): Service[] {
        return [
            this.informationService,
            this.service
        ];
    }

}
