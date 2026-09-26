// Every attribute rule, keyed by a stable name. See common.js for the shape of an entry.

import { attackRules } from './attacks.js';
import { protectionRules } from './protection.js';
import { systemRules } from './systems.js';

export const ATTRIBUTE_RULES = { ...attackRules, ...protectionRules, ...systemRules };
