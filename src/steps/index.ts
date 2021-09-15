import fetchAccounts from './fetch-accounts';
import fetchZones from './fetch-zones';

const integrationSteps = [fetchAccounts, fetchZones];

export { integrationSteps };
