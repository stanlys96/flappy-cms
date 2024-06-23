'use strict';

/**
 * boosted-account service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::boosted-account.boosted-account');
