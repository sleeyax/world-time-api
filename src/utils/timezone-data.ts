import * as tc from "timezonecomplete";
import * as TzData from 'tzdata';

tc.TzDatabase.init(TzData);

export {tc};
