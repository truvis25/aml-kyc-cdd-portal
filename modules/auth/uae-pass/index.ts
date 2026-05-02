export {
  initiateAuthentication,
  completeAuthentication,
  getLatestSucceededAuthentication,
  isAssuranceAcceptable,
} from './service';
export { readUaePassConfig } from './config';
export { userInfoToPrefill, normaliseDob, countryNameToIso2, normalisePhone } from './claims';
export { UaePassError } from './types';
export type {
  UaePassAssuranceLevel,
  UaePassUserInfo,
  UaePassErrorCode,
} from './types';
export type { UaePassAuthenticationRow } from './repository';
export type { PrefillIdentity } from './claims';
