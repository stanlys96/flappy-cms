'use strict';

/**
 * one-hundred-point service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::one-hundred-point.one-hundred-point');
