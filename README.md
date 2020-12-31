# homebridge-rcontrol
### 🚨 RControl Alarm System Plugin for Homebridge

`homebridge-rcontrol` is a plugin for [Homebridge](https://homebridge.io/) that enables security systems accessible from RControl (an iOS/Android app) to be used through HomeKit.

## Notes
- homebridge-rcontrol only supports RControl accounts with one area.
- Since RControl doesn't allow for different arming modes, all the armed options in HomeKit (home, away, night) map to the same functionality.
- Due to limited testing and the usage of RControl's undocumented and private API, this is unstable and may cease to work in the future. 

## License
`homebridge-rcontrol` is licensed under the MIT license.
